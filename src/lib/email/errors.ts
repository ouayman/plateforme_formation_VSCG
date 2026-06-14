export class EmailServiceError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "EmailServiceError";
    this.cause = cause;
  }
}
