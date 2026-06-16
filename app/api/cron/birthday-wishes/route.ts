import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getBirthdayEmailHtml } from "@/lib/birthdayEmail";

export const runtime = "nodejs";

type BirthdayUser = {
  id: string;
  name: string | null;
  email: string;
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const users = await db.$queryRaw<BirthdayUser[]>`
      SELECT "id", "name", "email"
      FROM "User"
      WHERE "dateOfBirth" IS NOT NULL
        AND EXTRACT(MONTH FROM "dateOfBirth") = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM "dateOfBirth") = EXTRACT(DAY FROM CURRENT_DATE)
    `;

    let sentCount = 0;

    for (const user of users) {
      await sendEmail({
        to: user.email,
        subject: "Happy Birthday from Selenite Care! 🎉",
        html: getBirthdayEmailHtml(user.name ?? "Beautiful Soul"),
      });
      sentCount += 1;
    }

    return Response.json({
      success: true,
      matchedUsers: users.length,
      sentCount,
    });
  } catch (error) {
    console.error("Failed to send birthday wishes", error);
    return Response.json(
      { error: "Failed to send birthday wishes." },
      { status: 500 },
    );
  }
}
