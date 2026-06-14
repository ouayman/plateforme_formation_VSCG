import { sendEmail } from "@/lib/email";

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  await sendEmail({ to, subject, html, text });
}
