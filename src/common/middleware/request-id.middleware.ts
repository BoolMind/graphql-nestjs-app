import { randomUUID } from 'node:crypto';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';

export const REQUEST_ID_HEADER =
  'x-request-id';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incomingRequestId =
    req.header(REQUEST_ID_HEADER)?.trim();

  const requestId =
    incomingRequestId || randomUUID();

  req.headers[REQUEST_ID_HEADER] =
    requestId;

  res.setHeader(
    REQUEST_ID_HEADER,
    requestId,
  );

  next();
}
