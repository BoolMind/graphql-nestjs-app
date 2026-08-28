import { AppException } from './app.exception';

export class ValidationException extends AppException {
  constructor(
    message: string,
    details?: unknown,
  ) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      details,
    });

    this.name = 'ValidationException';
  }
}
