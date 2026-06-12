import { APP_NAME, COLORS } from "@/lib/constants";
import { resolveMediaUrl } from "@/lib/media-url";

type WelcomeEmailProps = {
  firstName: string;
  loginUrl: string;
  logoUrl: string;
  organizationName: string;
};

export function renderWelcomeEmail({
  firstName,
  loginUrl,
  logoUrl,
  organizationName,
}: WelcomeEmailProps) {
  const logoSrc = logoUrl.startsWith("http") ? logoUrl : `${loginUrl.replace(/\/login$/, "")}${resolveMediaUrl(logoUrl)}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.08);">
        <tr><td style="padding:40px 32px 24px;text-align:center;">
          <img src="${logoSrc}" alt="${organizationName}" height="48" style="display:block;margin:0 auto 20px;max-width:240px;height:auto;" />
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${COLORS.secondary};">Bienvenue ${firstName} !</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#64748b;">Votre compte sur la plateforme ${APP_NAME} a été créé. Connectez-vous pour accéder à vos formations.</p>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;text-align:center;">
          <a href="${loginUrl}" style="display:inline-block;background:${COLORS.primary};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:14px;">Accéder à la plateforme</a>
          <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Connexion sécurisée par code OTP envoyé à votre email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
