import { auth } from "@/auth";
import { authorizeReportBooking } from "@/lib/consultationReports";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { bookingId } = await context.params;
  const access = await authorizeReportBooking({
    bookingId,
    actor: session.user,
    allowOwningClient: true,
  });

  if (!access.booking) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const prescriptions = await db.prescription.findMany({
    where: { bookingId },
    select: {
      id: true,
      version: true,
      followUpDays: true,
      followUpDate: true,
      createdByRole: true,
      sentAt: true,
    },
    orderBy: { version: "desc" },
  });

  return Response.json({
    prescriptions: prescriptions.map((prescription) => ({
      ...prescription,
      downloadUrl: `/api/prescriptions/download/${prescription.id}`,
    })),
  });
}

