import {
  ValidationError,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';

import { ValidationException } from '../exceptions';

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Array<{
  field: string;
  messages: string[];
}> {
  const result: Array<{
    field: string;
    messages: string[];
  }> = [];

  for (const error of errors) {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      result.push({
        field,
        messages: Object.values(error.constraints),
      });
    }

    if (error.children?.length) {
      result.push(...flattenValidationErrors(error.children, field));
    }
  }

  return result;
}

export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,

      exceptionFactory: (errors) =>
        new ValidationException(
          'Validation failed',
          flattenValidationErrors(errors),
        ),
    });
  }
}
