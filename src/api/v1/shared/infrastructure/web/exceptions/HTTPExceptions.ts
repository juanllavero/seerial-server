import { HTTPCodes } from "../../../domain/types/HTTPCodes";

/**
 * Base class for HTTP exceptions.
 * Extends the native Error class to include HTTP status codes.
 */
export class HttpException extends Error {
  public statusCode: number;
  public errors?: any;

  /**
   * @param {number} statusCode - The HTTP status code (e.g., 400, 404).
   * @param {string} message - The error message.
   * @param {any} [errors] - Optional additional error details (e.g., validation fields).
   */
  constructor(statusCode: number, message: string, errors?: any) {
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
  constructor(message: string = "Resource not found") {
    super(HTTPCodes.NOT_FOUND, message);
  }
}

/**
 * Exception for scenarios where not enough parameters are provided.
 */
export class NotEnoughParamsException extends HttpException {
  constructor(message: string = "Not enough parameters provided") {
    super(HTTPCodes.BAD_REQUEST, message);
  }
}

/**
 * Exception for 400 Bad Request scenarios.
 */
export class BadRequestException extends HttpException {
  constructor(message: string = "Bad Request", errors?: any) {
    super(HTTPCodes.BAD_REQUEST, message, errors);
  }
}

/**
 * Exception for 401 Unauthorized scenarios.
 */
export class UnauthorizedException extends HttpException {
  constructor(message: string = "Unauthorized") {
    super(HTTPCodes.UNAUTHORIZED, message);
  }
}
