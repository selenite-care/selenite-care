import { sendEmail } from "@/lib/email";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

const contactEmail = process.env.CONTACT_EMAIL?.trim() || "careselenite@gmail.com";

function asRequiredString(value: unknown) {
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
  const body = (await request.json().catch(() => null)) as ContactPayload | null;

  const name = asRequiredString(body?.name);
  const email = asRequiredString(body?.email);
  const message = asRequiredString(body?.message);

  if (!name || !email || !message) {
    return Response.json(
      { error: "Name, email, and message are required." },
      { status: 400 },
    );
  }

  if (!email.includes("@")) {
    return Response.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const html = `
    <div style="font-family: Arial, sans-serif; color: #2B2B2B; line-height: 1.6;">
      <h2 style="margin-bottom: 16px;">New Contact Message - Selenite Care</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #EADDCD; font-weight: bold;">Name</td>
            <td style="padding: 10px; border: 1px solid #EADDCD;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #EADDCD; font-weight: bold;">Email</td>
            <td style="padding: 10px; border: 1px solid #EADDCD;">${escapeHtml(email)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #EADDCD; font-weight: bold; vertical-align: top;">Message</td>
            <td style="padding: 10px; border: 1px solid #EADDCD; white-space: pre-wrap;">${escapeHtml(message)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    await sendEmail({
      to: contactEmail,
      subject: `New Contact Message from ${name}`,
      html,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Contact form email failed:", error);
    return Response.json(
      { error: "Unable to send your message right now. Please try again." },
      { status: 500 },
    );
  }
}
