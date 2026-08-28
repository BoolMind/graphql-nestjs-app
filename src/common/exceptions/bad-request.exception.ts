import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class BadRequestException extends AppException {
  constructor(message = 'Bad request') {
    super(message, ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
  }
}
