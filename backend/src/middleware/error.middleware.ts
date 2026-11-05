import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error] Unhandled request error:', err);

  const status = 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';

  res.status(status).json({
    error: 'SERVER_ERROR',
    message,
  });
}
