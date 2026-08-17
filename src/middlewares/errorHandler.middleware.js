import { AppError } from '../utils/AppError.js';
import { formatApiResponse } from '../utils/helpers.js';

export const errorHandler = (err, req, res, next) => {
  // If headers were already sent, responding again would throw
  // ERR_HTTP_HEADERS_SENT and mask the original error. Just log and bail.
  if (res.headersSent) {
    console.error('[ErrorHandler] Headers already sent — cannot respond:', err);
    return;
  }

  if (err instanceof AppError) {
    return res.status(err.status).json(formatApiResponse({
      status: err.status,
      message: err.message,
      data: err.details ? { issues: err.details } : undefined,
    }));
  }

  if (err?.name === 'ZodError') {
    const issues = err.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return res.status(400).json(formatApiResponse({
      status: 400,
      message: 'Validation failed',
      data: { issues },
    }));
  }

  console.error('[ErrorHandler] Unhandled error:', err);
  return res.status(500).json(formatApiResponse({
    status: 500,
    message: 'Internal server error',
  }));
};
