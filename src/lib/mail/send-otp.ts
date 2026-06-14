import { renderOtpEmail } from "@/emails/otp-code";
import { sendEmail } from "@/lib/email";

export async function sendOtpEmail(to: string, code: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const html = renderOtpEmail({ code, appUrl });

  if (process.env.NODE_ENV === "development") {
    console.log(`[OTP] ${to}: ${code}`);
  }

  await sendEmail({
    to,
    subject: `${code} — votre code de connexion`,
    html,
  });
}
