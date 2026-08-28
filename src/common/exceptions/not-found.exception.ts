import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class NotFoundException extends AppException {
  constructor(message = 'Resource not found') {
    super(message, ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}
