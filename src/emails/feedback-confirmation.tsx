import { APP_NAME, COLORS } from "@/lib/constants";

type FeedbackConfirmationEmailProps = {
  firstName: string;
  trainingTitle: string;
  rating: number;
  logoUrl: string;
  organizationName?: string;
};

export function renderFeedbackConfirmationEmail({
  firstName,
  trainingTitle,
  rating,
  logoUrl,
  organizationName = APP_NAME,
}: FeedbackConfirmationEmailProps): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr>
          <td style="background:${COLORS.secondary};padding:32px;text-align:center;">
            <img src="${logoUrl}" alt="${organizationName}" width="48" height="48" style="display:block;margin:0 auto 12px;max-width:200px;height:auto;" />
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">${organizationName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;color:${COLORS.text};font-size:15px;">Bonjour ${firstName},</p>
            <p style="margin:0 0 16px;color:${COLORS.text};font-size:15px;line-height:1.5;">
              Merci pour votre retour sur <strong>${trainingTitle}</strong>.
            </p>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Note enregistrée : ${rating}/5</p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
              Vous pouvez répondre à cet email si vous souhaitez nous contacter.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
