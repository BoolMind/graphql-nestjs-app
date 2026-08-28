import { Injectable } from '@nestjs/common';
import { ValidationPipe as NestValidationPipe } from '@nestjs/common';

import { ValidationException } from '../exceptions';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new ValidationException('Validation failed', errors),
    });
  }
}
