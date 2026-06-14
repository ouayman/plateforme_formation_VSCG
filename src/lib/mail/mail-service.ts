/** @deprecated Préférer `@/lib/email` (`sendEmail`). Conservé pour compatibilité. */
export {
  EmailServiceError as MailServiceError,
  sendEmail,
  sendEmail as sendMail,
} from "@/lib/email";

export type { SendEmailInput as SendMailOptions } from "@/lib/email";
