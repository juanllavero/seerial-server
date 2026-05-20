import { HTTPCodes } from '../../../domain/types/HTTPCodes';

/**
 * Base class for HTTP exceptions.
 * Extends the native Error class to include HTTP status codes.
 */
export class HttpException extends Error {
  public statusCode: number;
  public errors?: unknown;

  /**
   * @param {number} statusCode - The HTTP status code (e.g., 400, 404).
   * @param {string} message - The error message.
   * @param {unknown} [errors] - Optional additional error details (e.g., validation fields).
   */
  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, HttpException.prototype);
  }
}

/**
 * Exception for 404 Not Found scenarios.
 */
export class NotFoundException extends HttpException {
  constructor(message: string = 'Resource not found') {
    super(HTTPCodes.NOT_FOUND, message);
  }
}

/**
 * Exception for scenarios where not enough parameters are provided.
 */
export class NotEnoughParamsException extends HttpException {
  constructor(message: string = 'Not enough parameters provided') {
    super(HTTPCodes.BAD_REQUEST, message);
  }
}

/**
 * Exception for 400 Bad Request scenarios.
 */
export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad Request', errors?: unknown) {
    super(HTTPCodes.BAD_REQUEST, message, errors);
  }
}

/**
 * Exception for 401 Unauthorized scenarios.
 */
export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized') {
    super(HTTPCodes.UNAUTHORIZED, message);
  }
}

/**
 * Exception for 403 Forbidden scenarios.
 */
export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden') {
    super(HTTPCodes.FORBIDDEN, message);
  }
}

/**
 * Exception for 409 Conflict scenarios.
 */
export class ConflictException extends HttpException {
  constructor(message: string = 'Conflict') {
    super(HTTPCodes.CONFLICT, message);
  }
}

/**
 * Exception for 500 Repository Error scenarios.
 */
export class RepositoryException extends HttpException {
  constructor(message: string = 'Internal Server Error', errors?: unknown) {
    super(HTTPCodes.SERVER_ERROR, message, errors);
  }
}
