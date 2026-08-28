import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class ValidationException extends AppException {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, details);
  }
}
