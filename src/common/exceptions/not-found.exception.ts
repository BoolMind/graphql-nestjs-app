import { AppException } from './app.exception';

export class NotFoundException extends AppException {
  constructor(
    resource: string,
    details?: unknown,
  ) {
    super({
      code: 'NOT_FOUND',
      message: `${resource} not found`,
      details,
    });

    this.name = 'NotFoundException';
  }
}
