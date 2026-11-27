import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import {
  authorizeReportBooking,
  buildConsultationReportData,
  calculateFollowUpDate,
  getConsultationDate,
  hasReportContent,
  parseFollowUpDays,
  PRESCRIPTION_BUCKET,
  REPORT_STAFF_ROLES,
  type ConsultationReportBooking,
} from "@/lib/consultationReports";
import { db } from "@/lib/db";
import { generateConsultationReportPdf } from "@/lib/generatePrescriptionPdf";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import {
  deleteFromSupabase,
  uploadPrivateToSupabase,
} from "@/lib/supabaseStorage";

export const runtime = "nodejs";
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

type SendStep =
  | "load data"
  | "generate PDF"
  | "upload"
  | "save record"
  | "notify";

const prescriptionSelect = {
  id: true,
  version: true,
  followUpDays: true,
  followUpDate: true,
  createdByRole: true,
  sentAt: true,
} satisfies Prisma.PrescriptionSelect;

type SentPrescription = Prisma.PrescriptionGetPayload<{
  select: typeof prescriptionSelect;
}>;

type AttemptResult =
  | { ok: true; prescription: SentPrescription }
  | {
      ok: false;
      step: Exclude<SendStep, "notify">;
      error: unknown;
      safeMessage: string;
      versionConflict?: boolean;
    };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function logStepError(
  step: SendStep,
  error: unknown,
  detail?: string,
) {
  console.error(
    `[Consultation report send: ${step}]${detail ? ` ${detail}` : ""}`,
    error,
  );
}

function isVersionConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function cleanUpUploadedReport(path: string) {
  try {
    await deleteFromSupabase(PRESCRIPTION_BUCKET, path);
  } catch (error) {
    logStepError("save record", error, `cleanup failed for ${path}`);
  }
}

async function createReportAttempt(input: {
  booking: ConsultationReportBooking;
  followUpDays: number | null;
  createdById: string;
  createdByRole: string;
}): Promise<AttemptResult> {
  const { booking, followUpDays, createdById, createdByRole } = input;
  let nextVersion: number;

  try {
    const latest = await db.prescription.findFirst({
      where: { bookingId: booking.id },
      select: { version: true },
      orderBy: { version: "desc" },
    });
    nextVersion = (latest?.version ?? 0) + 1;
  } catch (error) {
    return {
      ok: false,
      step: "load data",
      error,
      safeMessage: "Unable to determine the next report version.",
    };
  }

  const consultationDate = getConsultationDate(booking);
  const followUpDate = calculateFollowUpDate(consultationDate, followUpDays);
  const generatedAt = new Date();
  const pdfPath = `reports/${booking.id}/v${nextVersion}.pdf`;
  let pdf: Buffer;

  try {
    const reportData = buildConsultationReportData({
      booking,
      followUpDays,
      followUpDate,
      version: nextVersion,
      generatedAt,
    });
    pdf = await generateConsultationReportPdf(reportData);
  } catch (error) {
    return {
      ok: false,
      step: "generate PDF",
      error,
      safeMessage: "Unable to generate the consultation report PDF.",
    };
  }

  try {
    await uploadPrivateToSupabase(
      pdf,
      PRESCRIPTION_BUCKET,
      pdfPath,
      "application/pdf",
    );
  } catch (error) {
    return {
      ok: false,
      step: "upload",
      error,
      safeMessage: "Unable to securely upload the consultation report.",
    };
  }

  try {
    const prescription = await db.prescription.create({
      data: {
        bookingId: booking.id,
        version: nextVersion,
        pdfPath,
        followUpDays,
        followUpDate,
        createdById,
        createdByRole,
        sentAt: generatedAt,
      },
      select: prescriptionSelect,
    });

    return { ok: true, prescription };
  } catch (error) {
    await cleanUpUploadedReport(pdfPath);
    return {
      ok: false,
      step: "save record",
      error,
      safeMessage: isVersionConflict(error)
        ? "Another report version was created at the same time. Please try again."
        : "The report was uploaded but could not be saved. Nothing was sent to the client.",
      versionConflict: isVersionConflict(error),
    };
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!REPORT_STAFF_ROLES.has(session.user.role)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { bookingId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    followUpDays?: unknown;
  };
  const followUpDays = parseFollowUpDays(body.followUpDays);

  if (followUpDays === undefined) {
    return Response.json(
      { error: "followUpDays must be null, 3, 7, 14, 30, or 60." },
      { status: 400 },
    );
  }

  let booking: ConsultationReportBooking;

  try {
    const access = await authorizeReportBooking({
      bookingId,
      actor: session.user,
      allowOwningClient: false,
    });

    if (!access.booking) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    booking = access.booking;
  } catch (error) {
    logStepError("load data", error);
    return Response.json(
      { error: "Unable to load the booking data for this report." },
      { status: 500 },
    );
  }

  if (!hasReportContent(booking)) {
    return Response.json(
      {
        error:
          "Add a problem identification, recommended test, recommended product, or additional note before sending the report.",
      },
      { status: 400 },
    );
  }

  let prescription: SentPrescription | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await createReportAttempt({
      booking,
      followUpDays,
      createdById: session.user.id,
      createdByRole: session.user.role,
    });

    if (result.ok) {
      prescription = result.prescription;
      break;
    }

    logStepError(result.step, result.error, `attempt ${attempt + 1}`);

    if (result.versionConflict && attempt === 0) {
      continue;
    }

    return Response.json(
      { error: result.safeMessage },
      { status: result.versionConflict ? 409 : 500 },
    );
  }

  if (!prescription) {
    return Response.json(
      { error: "Unable to save the consultation report." },
      { status: 500 },
    );
  }

  try {
    await createNotification(
      booking.userId,
      "Your consultation report is ready",
      `Your consultation report for booking ${booking.token} is ready to view.`,
      NOTIFICATION_TYPES.SUCCESS,
      "/dashboard/reports",
    );
  } catch (error) {
    logStepError("notify", error, "in-app notification");
  }

  try {
    const conversation = await db.conversation.findUnique({
      where: { clientId: booking.userId },
      select: { id: true },
    });

    if (conversation) {
      const message = await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: session.user.id,
          content:
            "Your consultation report is ready. Open Reports in your dashboard to view it.",
          messageType: "TEXT",
          isReadByClient: false,
        },
        select: { createdAt: true },
      });

      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: message.createdAt,
          isRead: true,
        },
      });
    }
  } catch (error) {
    logStepError("notify", error, "Messages entry");
  }

  if (booking.user.email) {
    try {
      const { sendEmail } = await import("@/lib/email");
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
        "https://selenitecare.com";
      const clientName = booking.user.name || "Selenite Care Client";

      await sendEmail({
        to: booking.user.email,
        subject: "Your consultation report is ready - Selenite Care",
        html: `
          <div style="font-family:Arial,sans-serif;color:#2B2B2B;line-height:1.65">
            <h1 style="color:#B87B68">Your consultation report is ready</h1>
            <p>Hello ${escapeHtml(clientName)},</p>
            <p>Your consultation report and skincare plan for booking <strong>${escapeHtml(booking.token)}</strong> is now available.</p>
            <p><a href="${appUrl}/dashboard/reports" style="display:inline-block;background:#2B2B2B;color:#F8F5F0;padding:12px 18px;text-decoration:none;border-radius:6px">View Your Report</a></p>
            <p>If you need help, contact us at +880 1647-660300.</p>
          </div>
        `,
      });
    } catch (error) {
      logStepError("notify", error, "email");
    }
  }

  return Response.json(
    {
      prescription: {
        ...prescription,
        downloadUrl: `/api/prescriptions/download/${prescription.id}`,
      },
    },
    { status: 201 },
  );
}
