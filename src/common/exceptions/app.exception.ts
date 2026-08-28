export interface AppExceptionDetails {
  code: string;
  message: string;
  details?: unknown;
}

export class AppException extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor({
    code,
    message,
    details,
  }: AppExceptionDetails) {
    super(message);

    this.name = 'AppException';
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
