import { sendMail } from "@/lib/mail/mail-service";

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  await sendMail({ to, subject, html, text });
}
