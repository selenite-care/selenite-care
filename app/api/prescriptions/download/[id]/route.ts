import { auth } from "@/auth";
import {
  authorizeReportBooking,
  PRESCRIPTION_BUCKET,
} from "@/lib/consultationReports";
import { db } from "@/lib/db";
import { createSignedSupabaseUrl } from "@/lib/supabaseStorage";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const prescription = await db.prescription.findUnique({
    where: { id },
    select: {
      id: true,
      bookingId: true,
      pdfPath: true,
    },
  });

  if (!prescription) {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }

  const access = await authorizeReportBooking({
    bookingId: prescription.bookingId,
    actor: session.user,
    allowOwningClient: true,
  });

  if (!access.booking) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  try {
    const signedUrl = await createSignedSupabaseUrl(
      PRESCRIPTION_BUCKET,
      prescription.pdfPath,
      60,
    );

    return Response.json(
      { url: signedUrl, expiresIn: 60 },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Consultation report signed URL failed:", error);
    return Response.json(
      { error: "Unable to prepare the report download." },
      { status: 500 },
    );
  }
}

