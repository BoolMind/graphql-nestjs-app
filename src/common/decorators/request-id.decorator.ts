import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';

export const RequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();

    return request.header(REQUEST_ID_HEADER) ?? undefined;
  },
);
