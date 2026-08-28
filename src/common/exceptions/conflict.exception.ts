import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class ConflictException extends AppException {
  constructor(message = 'Resource already exists') {
    super(message, ErrorCode.CONFLICT, HttpStatus.CONFLICT);
  }
}
