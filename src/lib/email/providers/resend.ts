import { Resend } from "resend";

import { EmailServiceError } from "@/lib/email/errors";
import type { EmailProvider, ResolvedSendEmailInput } from "@/lib/email/types";

let cachedClient: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new EmailServiceError("RESEND_API_KEY manquant");
  }

  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }

  return cachedClient;
}

export function createResendProvider(): EmailProvider {
  return {
    async send(input: ResolvedSendEmailInput): Promise<void> {
      const to = Array.isArray(input.to) ? input.to : [input.to];

      try {
        const { error } = await getResendClient().emails.send({
          from: input.from,
          to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          replyTo: input.replyTo,
        });

        if (error) {
          console.error("[email:resend] Échec envoi:", error);
          throw new EmailServiceError(error.message || "Échec envoi email", error);
        }
      } catch (error) {
        if (error instanceof EmailServiceError) throw error;
        console.error("[email:resend] Échec envoi:", error);
        throw new EmailServiceError("Échec envoi email", error);
      }
    },
  };
}
