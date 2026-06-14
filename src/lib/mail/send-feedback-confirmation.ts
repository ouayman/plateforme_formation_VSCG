import { renderFeedbackConfirmationEmail } from "@/emails/feedback-confirmation";
import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email";

export async function sendFeedbackConfirmationEmail(
  to: string,
  firstName: string,
  trainingTitle: string,
  rating: number
) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const html = renderFeedbackConfirmationEmail({
    firstName,
    trainingTitle,
    rating,
    appUrl,
  });

  await sendEmail({
    to,
    subject: `Merci pour votre avis — ${APP_NAME}`,
    html,
  });
}
