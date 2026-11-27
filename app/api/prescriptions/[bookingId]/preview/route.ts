import { auth } from "@/auth";
import {
  authorizeReportBooking,
  buildConsultationReportData,
  calculateFollowUpDate,
  getConsultationDate,
  parseFollowUpDays,
  REPORT_STAFF_ROLES,
} from "@/lib/consultationReports";
import { db } from "@/lib/db";
import { generateConsultationReportPdf } from "@/lib/generatePrescriptionPdf";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

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

  const access = await authorizeReportBooking({
    bookingId,
    actor: session.user,
    allowOwningClient: false,
  });

  if (!access.booking) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  try {
    const latest = await db.prescription.findFirst({
      where: { bookingId },
      select: { version: true },
      orderBy: { version: "desc" },
    });
    const consultationDate = getConsultationDate(access.booking);
    const generatedAt = new Date();
    const reportData = buildConsultationReportData({
      booking: access.booking,
      followUpDays,
      followUpDate: calculateFollowUpDate(consultationDate, followUpDays),
      version: (latest?.version ?? 0) + 1,
      generatedAt,
    });
    const pdf = await generateConsultationReportPdf(reportData);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="consultation-report-${access.booking.token}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Consultation report preview failed:", error);
    return Response.json(
      { error: "Unable to generate the consultation report preview." },
      { status: 500 },
    );
  }
}

