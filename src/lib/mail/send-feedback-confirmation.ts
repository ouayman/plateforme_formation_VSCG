import { renderFeedbackConfirmationEmail } from "@/emails/feedback-confirmation";
import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { getEmailBranding } from "@/lib/mail/email-branding";

export async function sendFeedbackConfirmationEmail(
  to: string,
  firstName: string,
  trainingTitle: string,
  rating: number,
  req?: Pick<Request, "headers">
) {
  const { logoUrl, organizationName } = await getEmailBranding(req);
  const html = renderFeedbackConfirmationEmail({
    firstName,
    trainingTitle,
    rating,
    logoUrl,
    organizationName,
  });

  await sendEmail({
    to,
    subject: `Merci pour votre avis — ${APP_NAME}`,
    html,
  });
}
