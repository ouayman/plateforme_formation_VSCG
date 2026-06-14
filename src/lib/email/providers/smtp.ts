import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { EmailServiceError } from "@/lib/email/errors";
import type { EmailProvider, ResolvedSendEmailInput } from "@/lib/email/types";

function resolveSmtpSecure(port: number): boolean {
  const secureEnv = process.env.SMTP_SECURE;
  if (secureEnv !== undefined && secureEnv !== "") {
    return secureEnv === "true";
  }
  return port === 465;
}

function createTransport(): Transporter {
  const port = Number(process.env.SMTP_PORT || 1025);
  const secure = resolveSmtpSecure(port);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    requireTLS: !secure && port === 587,
  });
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (!cachedTransport) {
    cachedTransport = createTransport();
  }
  return cachedTransport;
}

export function createSmtpProvider(): EmailProvider {
  return {
    async send(input: ResolvedSendEmailInput): Promise<void> {
      try {
        await getTransport().sendMail({
          from: input.from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          replyTo: input.replyTo,
        });
      } catch (error) {
        console.error("[email:smtp] Échec envoi:", error);
        throw new EmailServiceError("Échec envoi email", error);
      }
    },
  };
}
