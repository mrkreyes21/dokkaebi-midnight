import rateLimit from 'express-rate-limit';

export const sessionRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 40, // max 40 session creations per IP per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many game sessions requested. Please wait a few minutes.',
  },
});

export const finishRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30, // max 30 score submissions per IP per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many score submissions. Please wait a few minutes.',
  },
});
