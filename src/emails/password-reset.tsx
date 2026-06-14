import { APP_NAME, BRANDING, COLORS } from "@/lib/constants";

type PasswordResetEmailProps = {
  resetUrl: string;
  appUrl: string;
  firstName?: string;
};

export function renderPasswordResetEmail({
  resetUrl,
  appUrl,
  firstName,
}: PasswordResetEmailProps): string {
  const logoUrl = `${appUrl}${BRANDING.DEFAULT_FAVICON}`;
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr>
          <td style="background:${COLORS.secondary};padding:32px;text-align:center;">
            <img src="${logoUrl}" alt="${APP_NAME}" width="48" height="48" style="display:block;margin:0 auto 12px;" />
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">${APP_NAME}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;color:${COLORS.text};font-size:15px;">${greeting}</p>
            <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
              Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau.
            </p>
            <p style="margin:0 0 24px;text-align:center;">
              <a href="${resetUrl}" style="display:inline-block;background:${COLORS.primary};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 28px;border-radius:10px;">Réinitialiser mon mot de passe</a>
            </p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
              Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
