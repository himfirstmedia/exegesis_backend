import { ValidationError } from '../utils/AppError.js';

/**
 * Zod validation middleware.
 * Specify which parts of the request to validate: body, query, params.
 *
 * @param {object} schema - A Zod schema
 * @param {'body'|'query'|'params'|string[]} source - Which req properties to validate
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const sources = Array.isArray(source) ? source : [source];
    try {
      for (const s of sources) {
        const data = req[s];
        if (data !== undefined) {
          const parsed = schema.parse(data);
          // In Node.js 19+, req.query is a getter-only property on IncomingMessage.
          // Direct assignment fails, so we use defineProperty for query.
          if (s === 'query') {
            Object.defineProperty(req, 'query', {
              value: parsed,
              writable: true,
              configurable: true,
              enumerable: true,
            });
          } else {
            req[s] = parsed;
          }
        }
      }
      next();
    } catch (err) {
      if (err?.name === 'ZodError') {
        const issues = err.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        }));
        next(new ValidationError('Validation failed', issues));
      } else {
        next(err);
      }
    }
  };
};

/**
 * Wrap a controller to forward thrown errors to the error handler.
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
