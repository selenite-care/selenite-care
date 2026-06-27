import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type LeadPayload = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  interest?: unknown;
};

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: Request) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();

  if (!adminEmail) {
    return Response.json(
      { error: "ADMIN_EMAIL is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as LeadPayload | null;

  const name = asOptionalString(body?.name);
  const phone = asOptionalString(body?.phone);
  const email = asOptionalString(body?.email);
  const interest = asOptionalString(body?.interest);

  if (!phone && !email) {
    return Response.json(
      { error: "Please provide either your phone number or email address." },
      { status: 400 },
    );
  }

  if (email && !email.includes("@")) {
    return Response.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const lead = await db.leadCapture.create({
    data: {
      name: name || "Marketing Lead",
      phone,
      email: email || null,
      interest: interest || null,
    },
  });

  const submittedAt = lead.createdAt.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  });

  const html = `
    <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6;">
      <h2 style="margin-bottom: 16px;">New Lead from Landing Page - Selenite Care</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #D8C7B5; font-weight: bold;">Name</td>
            <td style="padding: 10px; border: 1px solid #D8C7B5;">${name ? escapeHtml(name) : "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #D8C7B5; font-weight: bold;">Phone</td>
            <td style="padding: 10px; border: 1px solid #D8C7B5;">${phone ? escapeHtml(phone) : "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #D8C7B5; font-weight: bold;">Email</td>
            <td style="padding: 10px; border: 1px solid #D8C7B5;">${email ? escapeHtml(email) : "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #D8C7B5; font-weight: bold;">Interest</td>
            <td style="padding: 10px; border: 1px solid #D8C7B5;">${interest ? escapeHtml(interest) : "Not specified"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #D8C7B5; font-weight: bold;">Submitted At</td>
            <td style="padding: 10px; border: 1px solid #D8C7B5;">${escapeHtml(submittedAt)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    await sendEmail({
      to: adminEmail,
      subject: "New Lead from Landing Page - Selenite Care",
      html,
    });
  } catch (error) {
    console.error("Landing lead email failed:", error);
    return Response.json(
      {
        error:
          "Lead was saved, but the admin notification email could not be sent.",
      },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    message: "Your details have been submitted successfully.",
  });
}
