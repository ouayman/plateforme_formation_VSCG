import { EmailServiceError } from "@/lib/email/errors";
import type { ResolvedSendEmailInput, SendEmailInput } from "@/lib/email/types";

function formatFrom(name: string, email: string): string {
  return `${name.trim()} <${email.trim()}>`;
}

function resolveProductionFrom(override?: string): string {
  if (override) return override;

  const email = process.env.RESEND_FROM_EMAIL?.trim();
  const name = process.env.RESEND_FROM_NAME?.trim();

  if (!email) {
    throw new EmailServiceError("RESEND_FROM_EMAIL manquant");
  }

  return name ? formatFrom(name, email) : email;
}

function resolveDevelopmentFrom(override?: string): string {
  if (override) return override;

  const from = process.env.SMTP_FROM?.trim();
  if (!from) {
    throw new EmailServiceError("SMTP_FROM manquant");
  }

  return from;
}

export function resolveSendEmailInput(input: SendEmailInput): ResolvedSendEmailInput {
  const isProduction = process.env.NODE_ENV === "production";
  const from = isProduction
    ? resolveProductionFrom(input.from)
    : resolveDevelopmentFrom(input.from);

  const replyTo =
    input.replyTo ??
    (isProduction ? process.env.RESEND_REPLY_TO?.trim() : process.env.SMTP_REPLY_TO?.trim()) ??
    undefined;

  return {
    ...input,
    from,
    replyTo: replyTo || undefined,
  };
}
