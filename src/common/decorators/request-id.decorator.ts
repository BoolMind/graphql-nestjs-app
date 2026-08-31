import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';

import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';

export const RequestId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext<{
      req?: Request;
      requestId?: string;
    }>();

    return (
      request.requestId ?? request.req?.header(REQUEST_ID_HEADER) ?? undefined
    );
  },
);
