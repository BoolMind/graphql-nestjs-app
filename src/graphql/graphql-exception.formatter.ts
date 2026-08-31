import { GraphQLError } from 'graphql';
import type { GraphQLFormattedError } from 'graphql';

import { AppException, ErrorCode } from '../common/exceptions';

export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const originalError =
    error instanceof GraphQLError ? error.originalError : undefined;

  if (originalError instanceof AppException) {
    const code = originalError.code;

    return {
      message:
        code === ErrorCode.INTERNAL_ERROR
          ? 'Internal server error'
          : formattedError.message,

      locations: formattedError.locations,
      path: formattedError.path,

      extensions: {
        code,
        ...(code !== ErrorCode.VALIDATION_ERROR &&
        originalError.details !== undefined
          ? { details: originalError.details }
          : {}),
      },
    };
  }

  if (error instanceof GraphQLError && !originalError) {
    return {
      message: formattedError.message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: {
        code: 'BAD_USER_INPUT',
      },
    };
  }

  return {
    message: 'Internal server error',
    locations: formattedError.locations,
    path: formattedError.path,
    extensions: {
      code: ErrorCode.INTERNAL_ERROR,
    },
  };
}
