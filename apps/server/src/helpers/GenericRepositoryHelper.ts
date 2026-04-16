import type {
	BaseEntity,
	DeepPartial,
	FindManyOptions,
	FindOneOptions,
	FindOptionsWhere,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";
import { createWithDefaults } from "./CreateWithDefaults";

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
	TDomain = TModel,
> {
	constructor(
		private model: typeof BaseEntity & (new () => TModel),
		private config: RepositoryConfig,
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
		options?: FindOneOptions<TModel>,
	): Promise<TDomain | null> {
		try {
			const entity = await this.model.findOne({
				where: { id } as unknown as FindOptionsWhere<TModel>,
				...options,
			});

			return entity ? this.toDomain(entity) : null;
		} catch (error) {
			repositoryLogger.error(
				error,
				`Failed to retrieve ${this.config.entityName} with ID ${id}`,
			);
			throw new Error(
				`Failed to retrieve ${this.config.entityName} with ID ${id}`,
			);
		}
	}

	/**
	 * Generic find by field value
	 */
	async findByField(
		field: string,
		value: unknown,
		options?: FindOneOptions<TModel>,
	): Promise<TDomain | null> {
		try {
			const entity = await this.model.findOne({
				where: { [field]: value } as unknown as FindOptionsWhere<TModel>,
				...options,
			});

			return entity ? this.toDomain(entity) : null;
		} catch (error) {
			repositoryLogger.error(
				error,
				`Failed to retrieve ${this.config.entityName} by ${field}`,
			);
			throw new Error(
				`Failed to retrieve ${this.config.entityName} by ${field}`,
			);
		}
	}

	/**
	 * Generic find many by field value
	 */
	async findManyByField(
		field: string,
		value: unknown,
		options?: FindManyOptions<TModel>,
	): Promise<TDomain[]> {
		try {
			const entities = await this.model.find({
				where: { [field]: value } as unknown as FindOptionsWhere<TModel>,
				...options,
			});

			return this.toDomainArray(entities);
		} catch (error) {
			repositoryLogger.error(
				error,
				`Failed to retrieve ${this.config.entityName} by ${field}`,
			);
			throw new Error(
				`Failed to retrieve ${this.config.entityName} by ${field}`,
			);
		}
	}

	/**
	 * Generic create with automatic ID generation and duplicate check
	 */
	async create(data: Partial<TDomain>, checkExisting = true): Promise<TDomain> {
		try {
			// Check if entity already exists by ID
			const dataWithId = data as Partial<TDomain> & { id?: string };
			if (checkExisting && dataWithId.id) {
				const existing = await this.findById(dataWithId.id);
				if (existing) {
					repositoryLogger.info(
						`${this.config.entityName} with ID ${dataWithId.id} already exists`,
					);
					return existing;
				}
			}

			// Generate ID if it doesn't exist
			const dataToCreate = {
				...data,
				id: dataWithId.id || this.generateId(),
			} as unknown as DeepPartial<TModel>;

			const created = createWithDefaults(this.model, dataToCreate);

			await created.save();
			return this.toDomain(created);
		} catch (error: unknown) {
			const dbError = error as { code?: string; message?: string };
			if (
				dbError.code === "23505" ||
				dbError.code === "ER_DUP_ENTRY" ||
				(typeof dbError.message === "string" &&
					dbError.message.includes("unique"))
			) {
				repositoryLogger.warn(
					`Unique constraint violation for ${this.config.entityName}. Returning undefined/error.`,
				);
				throw new Error(`${this.config.entityName} already exists.`);
			}

			repositoryLogger.error(
				error,
				`Failed to create ${this.config.entityName}`,
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
		checkExisting = true,
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
			const repository = this.model.getRepository();

			// Get json and relations fields
			const jsonColumns = repository.metadata.columns
				.filter((column) => column.type === "simple-json")
				.map((column) => column.propertyName);

			const relationNames = repository.metadata.relations.map(
				(relation) => relation.propertyName,
			);

			// Separate JSON and remove relations
			const updateData = { ...data } as Record<string, unknown>;
			const jsonDataToUpdate: Record<string, unknown> = {};

			for (const key of Object.keys(updateData)) {
				if (relationNames.includes(key)) {
					delete updateData[key]; // Avoid "library_id" null failure
				} else if (jsonColumns.includes(key)) {
					jsonDataToUpdate[key] = updateData[key];
					delete updateData[key];
				}
			}

			// Basic fields preload
			const preloaded = await repository.preload({
				...updateData,
				id,
			} as unknown as DeepPartial<TModel>);

			if (!preloaded) {
				throw new Error(`${this.config.entityName} with ID ${id} not found`);
			}

			// Force JSON fields
			for (const key of Object.keys(jsonDataToUpdate)) {
				(preloaded as Record<string, unknown>)[key] = jsonDataToUpdate[key];
			}

			// Save in database
			const saved = await preloaded.save();
			return this.toDomain(saved);
		} catch (error) {
			repositoryLogger.error(
				error,
				`Failed to update ${this.config.entityName} with ID ${id}`,
			);
			throw new Error(
				`Failed to update ${this.config.entityName} with ID ${id}`,
			);
		}
	}

	/**
	 * Generic delete
	 */
	async delete(id: string): Promise<void> {
		try {
			const result = await this.model.delete({
				id,
			} as unknown as FindOptionsWhere<TModel>);

			if (!result.affected || result.affected === 0) {
				throw new Error(`${this.config.entityName} with ID ${id} not found`);
			}
		} catch (error) {
			if (error instanceof Error && error.message.includes("not found")) {
				throw error;
			}
			repositoryLogger.error(
				error,
				`Failed to delete ${this.config.entityName} with ID ${id}`,
			);
			throw new Error(
				`Failed to delete ${this.config.entityName} with ID ${id}`,
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
				`Failed to retrieve all ${this.config.entityName}`,
			);
			throw new Error(`Failed to retrieve all ${this.config.entityName}`);
		}
	}

	/**
	 * Generic method to create a many-to-many relationship entity
	 */
	async createRelationship<TRelationModel extends BaseEntity>(
		relationModel: typeof BaseEntity & (new () => TRelationModel),
		relationData: Partial<TRelationModel>,
		checkExisting = true,
	): Promise<TRelationModel> {
		try {
			// Check if relationship already exists if checkExisting is true
			if (checkExisting && relationData) {
				const existing = await relationModel.findOne({
					where: relationData as FindOptionsWhere<TRelationModel>,
				});

				if (existing) {
					return existing;
				}
			}

			const relationDataWithId = relationData as Partial<TRelationModel> & {
				id?: string;
			};

			// Generate ID if it doesn't exist
			const dataToCreate = {
				...relationData,
				id: relationDataWithId.id || this.generateId(),
			} as unknown as DeepPartial<TRelationModel>;

			const created = relationModel.create(dataToCreate);
			await created.save();

			return created as TRelationModel;
		} catch (error) {
			repositoryLogger.error(
				error,
				`Failed to create ${this.config.entityName} relationship`,
			);
			throw new Error(
				`Failed to create ${this.config.entityName} relationship`,
			);
		}
	}

	/**
	 * Generic method to delete a many-to-many relationship entity
	 */
	async deleteRelationship<TRelationModel extends BaseEntity>(
		relationModel: typeof BaseEntity & (new () => TRelationModel),
		whereCondition: Partial<TRelationModel>,
	): Promise<void> {
		try {
			await relationModel.delete(
				whereCondition as unknown as FindOptionsWhere<TRelationModel>,
			);
		} catch (error) {
			repositoryLogger.error(
				error,
				`Failed to delete ${this.config.entityName} relationship`,
			);
			throw new Error(
				`Failed to delete ${this.config.entityName} relationship`,
			);
		}
	}
}
