import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    doctorId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { doctorId } = await context.params;

  if (!doctorId) {
    return Response.json({ error: "Doctor ID is required." }, { status: 400 });
  }

  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      name: true,
      designation: true,
      bio: true,
      availability: true,
      image: true,
    },
  });

  if (!doctor) {
    return Response.json({ error: "Doctor not found." }, { status: 404 });
  }

  return Response.json({ doctor });
}
