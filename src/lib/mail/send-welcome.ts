import { renderWelcomeEmail } from "@/emails/welcome-user";
import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function sendWelcomeEmail(to: string, firstName: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const settings = await getPlatformSettings();
  const html = renderWelcomeEmail({
    firstName,
    loginUrl: `${appUrl}/login`,
    logoUrl: settings.logoLightUrl,
    organizationName: settings.organizationName,
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
