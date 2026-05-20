import { messages } from '@/config/messages';

/**
 * Standard API Response structure.
 * This class creates a consistent envelope for all API responses.
 *
 * @template T - The type of the data payload.
 */
export class ApiResponse<T> {
  public success: boolean;
  public message: string;
  public data: T | null;
  public timestamp: string;

  /**
   * @param {boolean} success - Indicates if the operation was successful.
   * @param {string} message - A human-readable message describing the result.
   * @param {T | null} data - The payload of the response.
   */
  constructor(success: boolean, message: string, data: T | null = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Factory method for successful responses.
   *
   * @param {T} data - The data to return.
   * @param {string} [message='Operation successful'] - Optional success message.
   * @returns {ApiResponse<T>} A new ApiResponse instance.
   */
  static success<T>(data: T, message: string = messages.success.default): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  /**
   * Factory method for error responses.
   *
   * @param {string} message - The error description.
   * @param {T | null} [data=null] - Optional error details.
   * @returns {ApiResponse<T>} A new ApiResponse instance.
   */
  static error<T>(message: string, data: T | null = null): ApiResponse<T> {
    return new ApiResponse(false, message, data);
  }
}
