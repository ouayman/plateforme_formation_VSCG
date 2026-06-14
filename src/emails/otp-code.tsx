import { APP_NAME, COLORS, OTP } from "@/lib/constants";

type OtpEmailProps = {
  code: string;
  logoUrl: string;
  organizationName?: string;
};

export function renderOtpEmail({
  code,
  logoUrl,
  organizationName = APP_NAME,
}: OtpEmailProps): string {
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
          <td style="padding:32px;text-align:center;">
            <p style="margin:0 0 8px;color:${COLORS.text};font-size:15px;">Votre code de connexion</p>
            <p style="margin:0 0 24px;font-size:36px;font-weight:700;letter-spacing:8px;color:${COLORS.primary};font-family:monospace;">${code}</p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
              Ce code expire dans ${OTP.VALIDITY_MINUTES} minutes.<br/>
              Si vous n'avez pas demandé ce code, ignorez cet email.
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
