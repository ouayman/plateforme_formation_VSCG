import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

export class MailServiceError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "MailServiceError";
    this.cause = cause;
  }
}

function resolveSmtpSecure(port: number): boolean {
  const secureEnv = process.env.SMTP_SECURE;
  if (secureEnv !== undefined && secureEnv !== "") {
    return secureEnv === "true";
  }
  return port === 465;
}

function createTransport() {
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

let cachedTransport: nodemailer.Transporter | null = null;

export function getMailTransport() {
  if (!cachedTransport) {
    cachedTransport = createTransport();
  }
  return cachedTransport;
}

export type SendMailOptions = Mail.Options;

export async function sendMail(options: SendMailOptions): Promise<void> {
  const from = options.from ?? process.env.SMTP_FROM;
  const replyTo = options.replyTo ?? process.env.SMTP_REPLY_TO ?? undefined;

  if (!from) {
    throw new MailServiceError("SMTP_FROM manquant");
  }

  try {
    await getMailTransport().sendMail({
      ...options,
      from,
      replyTo,
    });
  } catch (error) {
    console.error("[mail] Échec envoi:", error);
    throw new MailServiceError("Échec envoi email", error);
  }
}
