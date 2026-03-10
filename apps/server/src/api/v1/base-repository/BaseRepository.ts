import logger from '@/utils/logger';
import {
  BadRequestException,
  NotFoundException,
  RepositoryException,
} from '../shared/infrastructure/web/exceptions/HTTPExceptions';

const repositoryLogger = logger.child({ category: 'Repository' });

/**
 * Enhanced base repository with improved validations and error handling
 */
export abstract class BaseRepository {
  /**
   * Validate that an ID is valid
   */
  protected validateId(id: string, fieldName = 'ID'): string {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new BadRequestException(`${fieldName} is required and must be a non-empty string`);
    }
    return id.trim();
  }

  /**
   * Validate multiple IDs at once
   */
  protected validateIds(ids: Record<string, string>): Record<string, string> {
    const validated: Record<string, string> = {};

    for (const [key, value] of Object.entries(ids)) {
      validated[key] = this.validateId(value, key);
    }

    return validated;
  }

  /**
   * Validate that an object is not empty
   */
  protected validateData<T>(data: T, fieldName = 'Data'): T {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      throw new BadRequestException(`${fieldName} is required and cannot be empty`);
    }
    return data;
  }

  /**
   * Validate string field
   */
  protected validateString(
    value: string,
    fieldName: string,
    options?: {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
    },
  ): string {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a valid string`);
    }

    const trimmed = value.trim();

    if (options?.minLength && trimmed.length < options.minLength) {
      throw new BadRequestException(
        `${fieldName} must be at least ${options.minLength} characters long`,
      );
    }

    if (options?.maxLength && trimmed.length > options.maxLength) {
      throw new BadRequestException(`${fieldName} must not exceed ${options.maxLength} characters`);
    }

    if (options?.pattern && !options.pattern.test(trimmed)) {
      throw new BadRequestException(`${fieldName} format is invalid`);
    }

    return trimmed;
  }

  /**
   * Handle errors in a consistent way with improved error differentiation
   */
  protected async handleRepositoryError<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    entityName?: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Re-throw validation errors
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Re-throw not found errors
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Re-throw business errors (like "not found")
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }

      // Log and wrap unexpected errors
      repositoryLogger.error(error, errorMessage);
      throw new RepositoryException(errorMessage, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Ensure that an operation affected at least one row
   */
  protected ensureAffected(affectedCount: number, notFoundMessage: string): void {
    if (affectedCount === 0) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  /**
   * Safe operation wrapper that catches and logs errors without throwing
   * Useful for optional operations
   */
  protected async safeOperation<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      repositoryLogger.warn(error, errorMessage);
      return defaultValue;
    }
  }
}
