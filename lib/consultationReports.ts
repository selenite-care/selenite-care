import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ConsultationReportData } from "@/lib/generatePrescriptionPdf";
export { PRESCRIPTION_BUCKET } from "@/lib/prescriptionStorage";
import { formatTimeSlot } from "@/lib/slotGenerator";

export const ALLOWED_FOLLOW_UP_DAYS = new Set([3, 7, 14, 30, 60]);
export const REPORT_STAFF_ROLES = new Set(["ADMIN", "CRM", "DOCTOR"]);

const reportBookingInclude = {
  user: {
    select: {
      id: true,
      name: true,
      age: true,
      dateOfBirth: true,
      email: true,
      surveyProfile: {
        select: {
          age: true,
          skinType: true,
        },
      },
    },
  },
  doctor: {
    select: {
      id: true,
      userId: true,
      name: true,
      designation: true,
      specialization: true,
      bio: true,
      image: true,
    },
  },
  diagnosis: {
    select: {
      problemIdentification: true,
      recommendedTests: true,
      additionalNotes: true,
      recommendations: {
        include: {
          product: {
            select: {
              name: true,
              type: true,
              price: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  },
  surveyResponse: {
    select: {
      age: true,
      skinType: true,
    },
  },
  oneTimeConsultation: {
    select: {
      paymentStatus: true,
    },
  },
} satisfies Prisma.BookingInclude;

export type ConsultationReportBooking = Prisma.BookingGetPayload<{
  include: typeof reportBookingInclude;
}>;

export type ReportActor = {
  id: string;
  role: string;
  name?: string | null;
};

export type ReportAccessResult =
  | { booking: ConsultationReportBooking; error?: never; status?: never }
  | { booking?: never; error: string; status: number };

type BookingClient = Pick<Prisma.TransactionClient, "booking">;

export function parseFollowUpDays(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "number" || !ALLOWED_FOLLOW_UP_DAYS.has(value)) {
    return undefined;
  }

  return value;
}

export async function findReportBooking(
  bookingId: string,
  database: BookingClient = db,
) {
  return database.booking.findUnique({
    where: { id: bookingId },
    include: reportBookingInclude,
  });
}

async function isAssignedDoctor(
  booking: ConsultationReportBooking,
  actor: ReportActor,
) {
  if (!booking.doctorId || !booking.doctor) {
    return false;
  }

  if (booking.doctor.userId) {
    return booking.doctor.userId === actor.id;
  }

  const userName = actor.name?.trim();

  if (!userName) {
    return false;
  }

  const possibleNames = userName.toLowerCase().startsWith("dr.")
    ? [userName]
    : [userName, `Dr. ${userName}`];
  const doctor = await db.doctor.findFirst({
    where: {
      OR: [
        { userId: actor.id },
        {
          name: {
            in: possibleNames,
            mode: "insensitive",
          },
        },
      ],
    },
    select: { id: true },
  });

  return doctor?.id === booking.doctorId;
}

export async function authorizeReportBooking(input: {
  bookingId: string;
  actor: ReportActor;
  allowOwningClient: boolean;
}): Promise<ReportAccessResult> {
  const booking = await findReportBooking(input.bookingId);

  if (!booking) {
    return { error: "Booking not found.", status: 404 };
  }

  if (
    booking.isOneTimeConsultation &&
    booking.oneTimeConsultation?.paymentStatus !== "PAID"
  ) {
    return {
      error: "A paid one-time consultation is required for this report.",
      status: 403,
    };
  }

  const isOwningClient = input.actor.id === booking.userId;
  const isAdminOrCrm =
    input.actor.role === "ADMIN" || input.actor.role === "CRM";
  const canDoctorAccess =
    input.actor.role === "DOCTOR" &&
    (await isAssignedDoctor(booking, input.actor));

  if (
    !isAdminOrCrm &&
    !canDoctorAccess &&
    !(input.allowOwningClient && isOwningClient)
  ) {
    return { error: "Forbidden.", status: 403 };
  }

  return { booking };
}

function decodeCommonEntities(value: string) {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };

  return value.replace(
    /&(amp|lt|gt|quot|#39|nbsp);/gi,
    (entity) => entities[entity.toLowerCase()] ?? entity,
  );
}

export function richTextToPlainText(value: string | null | undefined) {
  if (!value?.trim()) {
    return "";
  }

  return decodeCommonEntities(
    value
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\s*li\b[^>]*>/gi, "- ")
      .replace(/<\s*\/\s*(p|li|ul|ol|blockquote)\s*>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

export function hasReportContent(booking: ConsultationReportBooking) {
  return Boolean(
    richTextToPlainText(booking.diagnosis?.problemIdentification) ||
      booking.diagnosis?.recommendations.length ||
      getRecommendedTests(booking.diagnosis?.recommendedTests).length ||
      richTextToPlainText(booking.diagnosis?.additionalNotes),
  );
}

export function getConsultationDate(booking: ConsultationReportBooking) {
  return booking.appointmentTime ?? booking.createdAt;
}

function getDhakaDateParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(value);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function calculateAgeFromDateOfBirth(
  dateOfBirth: Date | null,
  referenceDate: Date,
) {
  if (!dateOfBirth || Number.isNaN(dateOfBirth.getTime())) {
    return null;
  }

  const birth = getDhakaDateParts(dateOfBirth);
  const reference = getDhakaDateParts(referenceDate);
  let age = reference.year - birth.year;

  if (
    reference.month < birth.month ||
    (reference.month === birth.month && reference.day < birth.day)
  ) {
    age -= 1;
  }

  return age >= 0 && age <= 150 ? String(age) : null;
}

export function calculateFollowUpDate(
  consultationDate: Date,
  followUpDays: number | null,
) {
  if (followUpDays === null) {
    return null;
  }

  return new Date(
    consultationDate.getTime() + followUpDays * 24 * 60 * 60 * 1000,
  );
}

function getRecommendedTests(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as { name?: unknown; details?: unknown };
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const details =
      typeof record.details === "string" ? record.details.trim() : "";

    return name ? [{ name, details }] : [];
  });
}

export function buildConsultationReportData(input: {
  booking: ConsultationReportBooking;
  followUpDays: number | null;
  followUpDate: Date | null;
  version: number;
  generatedAt: Date;
}): ConsultationReportData {
  const { booking } = input;
  const consultationDate = getConsultationDate(booking);

  return {
    bookingToken: booking.token,
    clientName: booking.user.name || "Selenite Care Client",
    clientAge:
      booking.surveyResponse?.age ||
      booking.user.surveyProfile?.age ||
      booking.user.age ||
      calculateAgeFromDateOfBirth(
        booking.user.dateOfBirth,
        consultationDate,
      ),
    clientSkinType:
      booking.surveyResponse?.skinType ||
      booking.user.surveyProfile?.skinType ||
      null,
    doctor: booking.doctor
      ? {
          name: booking.doctor.name,
          designation: booking.doctor.designation,
          specialization: booking.doctor.specialization,
          bio: richTextToPlainText(booking.doctor.bio),
          imageUrl: booking.doctor.image,
        }
      : null,
    consultationDate,
    consultationTime: booking.timeSlot
      ? formatTimeSlot(booking.timeSlot)
      : "Time to be confirmed",
    problemIdentification: richTextToPlainText(
      booking.diagnosis?.problemIdentification,
    ),
    recommendedTests: getRecommendedTests(
      booking.diagnosis?.recommendedTests,
    ),
    recommendedProducts:
      booking.diagnosis?.recommendations.map((recommendation) => ({
        name: recommendation.product.name,
        type: recommendation.product.type,
        price: recommendation.product.price,
        doctorNote: richTextToPlainText(recommendation.note),
      })) ?? [],
    additionalNotes: richTextToPlainText(
      booking.diagnosis?.additionalNotes,
    ) || null,
    followUpDays: input.followUpDays,
    followUpDate: input.followUpDate,
    version: input.version,
    generatedAt: input.generatedAt,
  };
}

