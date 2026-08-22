/**
 * Custom application error class for standardized API errors
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx, 5xx)
   * @param {object} [details=null] - Additional error details or field errors
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details = null) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'Unauthorized', details = null) {
    return new AppError(message, 401, details);
  }

  static forbidden(message = 'Forbidden', details = null) {
    return new AppError(message, 403, details);
  }

  static notFound(message = 'Resource Not Found', details = null) {
    return new AppError(message, 404, details);
  }

  static unprocessable(message = 'Unprocessable Entity', details = null) {
    return new AppError(message, 422, details);
  }

  static payloadTooLarge(message = 'Payload Too Large', details = null) {
    return new AppError(message, 413, details);
  }

  static internal(message = 'Internal Server Error', details = null) {
    return new AppError(message, 500, details);
  }
}
