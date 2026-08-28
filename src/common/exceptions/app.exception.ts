import { HttpException, HttpStatus } from '@nestjs/common';

export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppException extends HttpException {
  constructor(
    message: string,
    code: ErrorCode,
    status: HttpStatus,
    details?: unknown,
  ) {
    super(
      {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      status,
    );
  }

  get code(): ErrorCode {
    const response = this.getResponse();

    if (
      typeof response === 'object' &&
      response !== null &&
      'code' in response &&
      typeof response.code === 'string'
    ) {
      return response.code as ErrorCode;
    }

    return ErrorCode.INTERNAL_ERROR;
  }

  get details(): unknown {
    const response = this.getResponse();

    if (
      typeof response === 'object' &&
      response !== null &&
      'details' in response
    ) {
      return response.details;
    }

    return undefined;
  }
}
