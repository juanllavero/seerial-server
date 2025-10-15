class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // To distinguish from bugs

    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
