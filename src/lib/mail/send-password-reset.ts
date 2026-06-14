import { renderPasswordResetEmail } from "@/emails/password-reset";
import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  firstName?: string
) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const html = renderPasswordResetEmail({ resetUrl, appUrl, firstName });

  await sendEmail({
    to,
    subject: `Réinitialisation de votre mot de passe — ${APP_NAME}`,
    html,
  });
}
