import { QueryFailedError } from 'typeorm';

import { ConflictException } from '../exceptions';

export class DatabaseExceptionMapper {
  static map(error: unknown): unknown {
    if (!(error instanceof QueryFailedError)) {
      return error;
    }

    const driverError = error.driverError as {
      code?: string;
      errno?: number;
    };

    if (driverError.code === 'ER_DUP_ENTRY' || driverError.errno === 1062) {
      return new ConflictException(
        'The requested operation violates a uniqueness constraint',
      );
    }

    if (driverError.errno === 1451 || driverError.errno === 1452) {
      return new ConflictException(
        'The requested operation violates a data relationship constraint',
      );
    }

    return error;
  }
}
