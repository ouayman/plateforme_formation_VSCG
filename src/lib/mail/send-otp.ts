import { renderOtpEmail } from "@/emails/otp-code";
import { sendEmail } from "@/lib/email";
import { getEmailBranding } from "@/lib/mail/email-branding";

export async function sendOtpEmail(
  to: string,
  code: string,
  req?: Pick<Request, "headers">
) {
  const { logoUrl, organizationName } = await getEmailBranding(req);
  const html = renderOtpEmail({ code, logoUrl, organizationName });

  if (process.env.NODE_ENV === "development") {
    console.log(`[OTP] ${to}: ${code}`);
  }

  await sendEmail({
    to,
    subject: `${code} — votre code de connexion`,
    html,
  });
}
