import type { BaseEntity } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/utils/logger';
import { createWithDefaults } from './CreateWithDefaults';

const relationHelperLogger = logger.child({ category: 'Relation Helper' });

/**
 * Helper for creating entities with relationships
 * Reduces duplication in methods like addAsMovie, addAsEpisode, etc.
 */
export class RelationshipCreationHelper<TModel, TDomain = TModel> {
  constructor(
    private model: typeof BaseEntity & (new () => TModel),
    private entityName: string,
    private findByIdFn: (id: string) => Promise<TDomain | null>,
    private generateShortId = true,
  ) {}

  /**
   * Generate an ID
   */
  private generateId(): string {
    const uuid = uuidv4();
    return this.generateShortId ? uuid.split('-')[0] : uuid;
  }

  /**
   * Generic method to create entity with a single relationship
   * Returns null on error instead of throwing (legacy behavior)
   */
  async createWithRelation(
    relationField: string,
    relationId: string,
    data?: Partial<TDomain>,
    throwOnError = false,
  ): Promise<TDomain | null> {
    try {
      // Check if entity already exists by ID
      const dataWithId = data as Partial<TDomain> & { id?: string };
      if (dataWithId?.id) {
        const existing = await this.findByIdFn(dataWithId.id);
        if (existing) {
          return existing;
        }
      }

      // Prepare data with relationship
      const entityData: Partial<TModel> = {
        ...(data as unknown as Partial<TModel>),
        id: this.generateId(),
        [relationField]: relationId,
      };

      const newEntity = createWithDefaults(this.model, entityData);

      await newEntity.save();
      return newEntity as unknown as TDomain;
    } catch (error) {
      relationHelperLogger.error(error, `Error creating ${this.entityName} with ${relationField}`);

      if (throwOnError) {
        throw new Error(`Error creating ${this.entityName} with ${relationField}`);
      }

      return null;
    }
  }

  /**
   * Create entity with multiple relationships
   */
  async createWithMultipleRelations(
    relations: Record<string, string>,
    data?: Partial<TDomain>,
    throwOnError = false,
  ): Promise<TDomain | null> {
    try {
      // Check if entity already exists by ID
      const dataWithId = data as Partial<TDomain> & { id?: string };
      if (dataWithId?.id) {
        const existing = await this.findByIdFn(dataWithId.id);
        if (existing) {
          return existing;
        }
      }

      // Prepare data with all relationships
      const entityData: Partial<TModel> = {
        ...(data as unknown as Partial<TModel>),
        id: this.generateId(),
        ...relations,
      };

      const newEntity = createWithDefaults(this.model, entityData);

      await newEntity.save();
      return newEntity as unknown as TDomain;
    } catch (error) {
      relationHelperLogger.error(
        error,
        `Error creating ${this.entityName} with multiple relations`,
      );

      if (throwOnError) {
        throw new Error(`Error creating ${this.entityName} with multiple relations`);
      }

      return null;
    }
  }
}
