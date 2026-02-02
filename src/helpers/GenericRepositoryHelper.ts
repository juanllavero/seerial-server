import logger from "@/utils/logger";
import {
  BaseEntity,
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

const repositoryLogger = logger.child({ category: "Generic Repository" });

/**
 * Configuration for generic repository operations
 */
export interface RepositoryConfig {
  entityName: string;
  generateShortId?: boolean; // Use only first segment of UUID
}

/**
 * Generic Repository Helper to reduce code duplication
 * This helper encapsulates common CRUD operations
 */
export class GenericRepositoryHelper<
  TModel extends BaseEntity,
  TDomain = TModel
> {
  constructor(
    private model: typeof BaseEntity & (new () => TModel),
    private config: RepositoryConfig
  ) {}

  /**
   * Generate an ID based on configuration
   */
  private generateId(): string {
    const uuid = uuidv4();
    return this.config.generateShortId ? uuid.split("-")[0] : uuid;
  }

  /**
   * Convert model to domain (override if needed custom mapping)
   */
  protected toDomain(model: TModel): TDomain {
    return model as unknown as TDomain;
  }

  /**
   * Convert model array to domain array
   */
  protected toDomainArray(models: TModel[]): TDomain[] {
    return models.map((m) => this.toDomain(m));
  }

  /**
   * Generic find by ID with optional relations
   */
  async findById(
    id: string,
    options?: FindOneOptions<TModel>
  ): Promise<TDomain | null> {
    try {
      const entity = await this.model.findOne({
        where: { id } as any,
        ...options,
      });

      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      repositoryLogger.error(
        error,
        `Failed to retrieve ${this.config.entityName} with ID ${id}`
      );
      throw new Error(
        `Failed to retrieve ${this.config.entityName} with ID ${id}`
      );
    }
  }

  /**
   * Generic find by field value
   */
  async findByField(
    field: string,
    value: any,
    options?: FindOneOptions<TModel>
  ): Promise<TDomain | null> {
    try {
      const entity = await this.model.findOne({
        where: { [field]: value } as any,
        ...options,
      });

      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      repositoryLogger.error(
        error,
        `Failed to retrieve ${this.config.entityName} by ${field}`
      );
      throw new Error(
        `Failed to retrieve ${this.config.entityName} by ${field}`
      );
    }
  }

  /**
   * Generic find many by field value
   */
  async findManyByField(
    field: string,
    value: any,
    options?: FindManyOptions<TModel>
  ): Promise<TDomain[]> {
    try {
      const entities = await this.model.find({
        where: { [field]: value } as any,
        ...options,
      });

      return this.toDomainArray(entities);
    } catch (error) {
      repositoryLogger.error(
        error,
        `Failed to retrieve ${this.config.entityName} by ${field}`
      );
      throw new Error(
        `Failed to retrieve ${this.config.entityName} by ${field}`
      );
    }
  }

  /**
   * Generic create with automatic ID generation and duplicate check
   */
  async create(data: Partial<TDomain>, checkExisting = true): Promise<TDomain> {
    try {
      // Check if entity already exists by ID
      if (checkExisting && (data as any).id) {
        const existing = await this.findById((data as any).id);
        if (existing) {
          repositoryLogger.info(
            `${this.config.entityName} with ID ${
              (data as any).id
            } already exists`
          );
          return existing;
        }
      }

      // Generate ID if it doesn't exist
      const dataToCreate = {
        ...data,
        id: (data as any).id || this.generateId(),
      } as unknown as DeepPartial<TModel>;

      const created = this.model.create(dataToCreate);
      await (created as any).save();

      return this.toDomain(created as TModel);
    } catch (error) {
      repositoryLogger.error(
        error,
        `Failed to create ${this.config.entityName}`
      );
      throw new Error(`Failed to create ${this.config.entityName}`);
    }
  }

  /**
   * Generic create with foreign key relationship
   */
  async createWithRelation(
    data: Partial<TDomain>,
    relationField: string,
    relationId: string,
    checkExisting = true
  ): Promise<TDomain> {
    const dataWithRelation = {
      ...data,
      [relationField]: relationId,
    };

    return this.create(dataWithRelation, checkExisting);
  }

  /**
   * Generic update
   */
  async update(id: string, data: Partial<TDomain>): Promise<TDomain> {
    try {
      const result = await this.model.update({ id } as any, data as any);

      if (!result.affected || result.affected === 0) {
        throw new Error(`${this.config.entityName} with ID ${id} not found`);
      }

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error(
          `Failed to retrieve updated ${this.config.entityName} with ID ${id}`
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw error;
      }
      repositoryLogger.error(
        error,
        `Failed to update ${this.config.entityName} with ID ${id}`
      );
      throw new Error(
        `Failed to update ${this.config.entityName} with ID ${id}`
      );
    }
  }

  /**
   * Generic delete
   */
  async delete(id: string): Promise<void> {
    try {
      const result = await this.model.delete({ id } as any);

      if (!result.affected || result.affected === 0) {
        throw new Error(`${this.config.entityName} with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw error;
      }
      repositoryLogger.error(
        error,
        `Failed to delete ${this.config.entityName} with ID ${id}`
      );
      throw new Error(
        `Failed to delete ${this.config.entityName} with ID ${id}`
      );
    }
  }

  /**
   * Generic find all with optional filter
   */
  async findAll(options?: FindManyOptions<TModel>): Promise<TDomain[]> {
    try {
      const entities = await this.model.find(options);
      return this.toDomainArray(entities);
    } catch (error) {
      repositoryLogger.error(
        error,
        `Failed to retrieve all ${this.config.entityName}`
      );
      throw new Error(`Failed to retrieve all ${this.config.entityName}`);
    }
  }
}
