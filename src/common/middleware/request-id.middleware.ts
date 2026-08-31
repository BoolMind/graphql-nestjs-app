import { randomUUID } from 'node:crypto';

import type { Request, Response, NextFunction } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,128}$/;

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incomingRequestId = req.header(REQUEST_ID_HEADER)?.trim();

  const requestId =
    incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId)
      ? incomingRequestId
      : randomUUID();

  req.headers[REQUEST_ID_HEADER] = requestId;

  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
