import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not set.");
}

if (!resendFromEmail) {
  throw new Error("RESEND_FROM_EMAIL is not set.");
}

const resend = new Resend(resendApiKey);

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions) {
  return resend.emails.send(
 {
    from: resendFromEmail!,
    to,
    subject,
    html,
  });
}
