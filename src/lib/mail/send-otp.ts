import { renderOtpEmail } from "@/emails/otp-code";
import { sendMail } from "@/lib/mail/mail-service";

export async function sendOtpEmail(to: string, code: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const html = renderOtpEmail({ code, appUrl });

  if (process.env.NODE_ENV === "development") {
    console.log(`[OTP] ${to}: ${code}`);
  }

  await sendMail({
    to,
    subject: `${code} — votre code de connexion`,
    html,
  });
}
