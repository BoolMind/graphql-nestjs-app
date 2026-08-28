import { GraphQLError } from 'graphql';
import type { GraphQLFormattedError } from 'graphql';

import { AppException } from '../common/exceptions';

export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const originalError =
    error instanceof GraphQLError
      ? error.originalError
      : undefined;

  let code =
    typeof formattedError.extensions?.code === 'string'
      ? formattedError.extensions.code
      : undefined;

  let details =
    formattedError.extensions?.details;

  if (originalError instanceof AppException) {
    code = originalError.code;
    details = originalError.details;
  }

  code ??= 'INTERNAL_SERVER_ERROR';

  const isInternal =
    code === 'INTERNAL_SERVER_ERROR';

  return {
    message: isInternal
      ? 'Internal server error'
      : formattedError.message,

    locations: formattedError.locations,
    path: formattedError.path,

    extensions: {
      ...formattedError.extensions,
      code,
      ...(details !== undefined
        ? { details }
        : {}),
    },
  };
}
