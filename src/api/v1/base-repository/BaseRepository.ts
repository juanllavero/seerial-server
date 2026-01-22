import logger from "@/utils/logger";

const repositoryLogger = logger.child({ category: "Repository" });

/**
 * Class base abstract for repositories with common validations
 */
export abstract class BaseRepository {
  /**
   * Validate that an ID is valid
   */
  protected validateId(id: string, fieldName = "ID"): string {
    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new Error(
        `${fieldName} is required and must be a non-empty string`
      );
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
  protected validateData<T>(data: T, fieldName = "Data"): T {
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      throw new Error(`${fieldName} is required and cannot be empty`);
    }
    return data;
  }

  /**
   * Handle errors in a consistent way
   */
  protected async handleRepositoryError<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Re-throw business errors (like "not found")
      if (error instanceof Error && error.message.includes("not found")) {
        throw error;
      }

      repositoryLogger.error(error, errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Ensure that an operation affected at least one row
   */
  protected ensureAffected(
    affectedCount: number,
    notFoundMessage: string
  ): void {
    if (affectedCount === 0) {
      throw new Error(notFoundMessage);
    }
  }
}
