import rateLimit from 'express-rate-limit';

export const graphqlRateLimiter = rateLimit({
  windowMs: 60 * 1000,

  limit: 100,

  standardHeaders: 'draft-8',

  legacyHeaders: false,

  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
  },
});
