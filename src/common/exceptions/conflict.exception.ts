import { AppException } from './app.exception';

export class ConflictException extends AppException {
  constructor(
    message: string,
    details?: unknown,
  ) {
    super({
      code: 'CONFLICT',
      message,
      details,
    });

    this.name = 'ConflictException';
  }
}
