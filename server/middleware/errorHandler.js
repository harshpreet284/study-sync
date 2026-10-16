/**
 * Catch-all middleware for handling 404 (Not Found) routes.
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Centralized error-handling middleware.
 * Formats errors consistently according to API contract:
 * { "success": false, "message": "Human-readable error message" }
 *
 * Never exposes stack traces, credentials, or internal implementation details to the client.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);

  // Server-side logging for diagnostics
  console.error(`[Error] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${err.message}`);

  // Safe client response
  const isServerFault = statusCode >= 500;
  const safeMessage = isServerFault && process.env.NODE_ENV === 'production'
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
};
