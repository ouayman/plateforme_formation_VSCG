export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

export type ResolvedSendEmailInput = SendEmailInput & {
  from: string;
  replyTo?: string;
};

export interface EmailProvider {
  send(input: ResolvedSendEmailInput): Promise<void>;
}
