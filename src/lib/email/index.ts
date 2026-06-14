import "server-only";

import { EmailServiceError } from "@/lib/email/errors";
import { createResendProvider } from "@/lib/email/providers/resend";
import { createSmtpProvider } from "@/lib/email/providers/smtp";
import { resolveSendEmailInput } from "@/lib/email/resolve-from";
import type { EmailProvider, SendEmailInput } from "@/lib/email/types";

export { EmailServiceError } from "@/lib/email/errors";
export type { SendEmailInput } from "@/lib/email/types";

let cachedProvider: EmailProvider | null = null;

function getEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;

  cachedProvider =
    process.env.NODE_ENV === "production"
      ? createResendProvider()
      : createSmtpProvider();

  return cachedProvider;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const resolved = resolveSendEmailInput(input);
  await getEmailProvider().send(resolved);
}
