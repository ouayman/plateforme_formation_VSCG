import { renderWelcomeEmail } from "@/emails/welcome-user";
import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { getEmailBranding } from "@/lib/mail/email-branding";

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  req?: Pick<Request, "headers">
) {
  const { appUrl, logoUrl, organizationName } = await getEmailBranding(req);
  const html = renderWelcomeEmail({
    firstName,
    loginUrl: `${appUrl}/login`,
    logoUrl,
    organizationName,
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`[Welcome] Email sent to ${to}`);
  }

  await sendEmail({
    to,
    subject: `Bienvenue sur ${APP_NAME}`,
    html,
  });
}
