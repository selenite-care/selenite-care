import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const bookings = await db.booking.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      token: true,
      status: true,
      appointmentTime: true,
      createdAt: true,
      doctor: {
        select: {
          name: true,
          designation: true,
        },
      },
      surveyResponse: {
        select: {
          skinType: true,
          skinIssues: true,
          skinImages: true,
          currentProductsImage: true,
          previousConsultation: true,
        },
      },
      diagnosis: {
        select: {
          problemIdentification: true,
          recommendations: {
            select: {
              product: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
      routineGuideline: {
        select: {
          content: true,
        },
      },
      customerFeedback: {
        select: {
          feedback: true,
          images: true,
        },
      },
    },
  });

  return Response.json({ bookings });
}
