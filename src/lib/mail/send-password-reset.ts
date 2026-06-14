import { renderPasswordResetEmail } from "@/emails/password-reset";
import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { getEmailBranding } from "@/lib/mail/email-branding";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  firstName?: string,
  req?: Pick<Request, "headers">
) {
  const { logoUrl, organizationName } = await getEmailBranding(req);
  const html = renderPasswordResetEmail({
    resetUrl,
    logoUrl,
    organizationName,
    firstName,
  });

  await sendEmail({
    to,
    subject: `Réinitialisation de votre mot de passe — ${APP_NAME}`,
    html,
  });
}
