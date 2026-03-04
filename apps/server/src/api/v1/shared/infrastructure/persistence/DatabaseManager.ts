import { AlbumArtistModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumArtistModel";
import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import { ArtistModel } from "@/api/v1/artists/infrastructure/persistence/models/ArtistModel";
import { CollectionAlbumModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionAlbum";
import { CollectionModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionModel";
import { CollectionMovieModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionMovie";
import { CollectionSeriesModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionSeries";
import { ContinueWatchingModel } from "@/api/v1/continue-watching/infrastructure/persistence/models/ContinueWatchingModel";
import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { LibraryCollectionModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryCollectionModel";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { MyListModel } from "@/api/v1/my-lists/infrastructure/persistence/models/MyListModel";
import { PlayListItemModel } from "@/api/v1/playlists/infrastructure/persistence/models/PlayListItemModel";
import { PlayListModel } from "@/api/v1/playlists/infrastructure/persistence/models/PlayListModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { ServerModel } from "@/api/v1/servers/infrastructure/persistence/models/ServerModel";
import { fileSystemService } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { SongModel } from "@/api/v1/songs/infrastructure/persistence/models/SongModel";
import { UserLibraryModel } from "@/api/v1/users/infrastructure/persistence/models/UserLibraryModel";
import { UserModel } from "@/api/v1/users/infrastructure/persistence/models/UserModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import logger from "@/utils/logger";
import fs from "fs";
import { DataSource, EntityManager, EntityTarget, Repository } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

const dbLogger = logger.child({ category: "Database" });

export class DatabaseManager {
  public static get DB_PATH(): string {
    return fileSystemService.getExternalPath("resources/db/data.db");
  }
  public static dataSource: DataSource | null = null;

  /**
   * Initialize SQLite DB with TypeORM and better-sqlite3.
   */
  public static async initializeDB(): Promise<void> {
    if (this.dataSource?.isInitialized) return;

    try {
      DatabaseManager.ensureDatabaseDirectory();

      // Initialize TypeORM DataSource
      DatabaseManager.dataSource = new DataSource({
        type: "better-sqlite3",
        database: DatabaseManager.DB_PATH,
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          CollectionModel,
          CollectionAlbumModel,
          CollectionMovieModel,
          CollectionSeriesModel,
          LibraryCollectionModel,
          ContinueWatchingModel,
          WatchListModel,
          EpisodeModel,
          LibraryModel,
          MovieModel,
          MyListModel,
          PlayListModel,
          PlayListItemModel,
          SeasonModel,
          SeriesModel,
          VideoModel,
          AlbumModel,
          AlbumArtistModel,
          ArtistModel,
          SongModel,
          ServerModel,
          UserModel,
          UserLibraryModel,
        ],
        logging: false,
        // logger: {
        //   log: (level, message) => {
        //     if (level === 'query') {
        //       dbLogger.info({ sql: message }, "Executed SQL query");
        //     } else {
        //       dbLogger.debug({ level, message }, "TypeORM log");
        //     }
        //   }
        // },
      });

      // Init db
      await DatabaseManager.dataSource.initialize();

      // Configure db
      const connection = DatabaseManager.dataSource.createQueryRunner();
      await connection.query("PRAGMA foreign_keys = ON;");
      await connection.query("PRAGMA journal_mode = WAL;");
      await connection.query("PRAGMA busy_timeout = 5000;");
      await connection.query("PRAGMA synchronous = NORMAL;");
      await connection.release();

      // Sync models to db
      await DatabaseManager.dataSource.synchronize(); // For dev; for prod, use migrations

      dbLogger.info(
        "Database initialized successfully with TypeORM and better-sqlite3"
      );
    } catch (error: any) {
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Get the current DataSource instance
   * @throws Error if DataSource is not initialized
   */
  public static getDataSource(): DataSource {
    if (!this.dataSource) {
      const error = new Error("DataSource has not been initialized");
      dbLogger.error(error);
      throw error;
    }

    if (!this.dataSource.isInitialized) {
      const error = new Error("DataSource is not initialized");
      dbLogger.error(error);
      throw error;
    }

    return this.dataSource;
  }

  /**
   * Get EntityManager from DataSource
   */
  public static getEntityManager(): EntityManager {
    return this.getDataSource().manager;
  }

  /**
   * Get a repository for a specific entity
   * @param entity The entity class to get repository for
   */
  public static getRepository<T extends object>(
    entity: EntityTarget<T>
  ): Repository<T> {
    return this.getDataSource().getRepository(entity);
  }

  /**
   * Create a new query runner for transactions
   */
  public static createQueryRunner() {
    return this.getDataSource().createQueryRunner();
  }

  /**
   * Execute raw query
   * @param sql The SQL query to execute
   * @param parameters Optional query parameters
   */
  public static async query(sql: string, parameters?: any[]): Promise<any> {
    try {
      const dataSource = this.getDataSource();
      return await dataSource.query(sql, parameters);
    } catch (error) {
      dbLogger.error(error, "Error executing raw query");
      throw error;
    }
  }

  /**
   * Check if DataSource is initialized
   */
  public static isInitialized(): boolean {
    return this.dataSource?.isInitialized ?? false;
  }

  /**
   * Health check - verify database connection
   */
  public static async healthCheck(): Promise<boolean> {
    try {
      const dataSource = this.getDataSource();

      if (!dataSource.isInitialized) {
        return false;
      }

      // Try a simple query to verify connection
      await dataSource.query("SELECT 1");
      return true;
    } catch (error) {
      dbLogger.error(error, "Health check failed");
      return false;
    }
  }

  /**
   * Run migrations
   */
  public static async runMigrations(): Promise<void> {
    try {
      const dataSource = this.getDataSource();
      await dataSource.runMigrations();
      dbLogger.info("Migrations executed successfully");
    } catch (error) {
      dbLogger.error(error, "Error running migrations");
      throw error;
    }
  }

  /**
   * Revert last migration
   */
  public static async revertLastMigration(): Promise<void> {
    try {
      const dataSource = this.getDataSource();
      await dataSource.undoLastMigration();
      dbLogger.info("Last migration reverted successfully");
    } catch (error) {
      dbLogger.error(error, "Error reverting last migration");
      throw error;
    }
  }

  /**
   * Synchronize database schema (use with caution in production)
   * @param dropBeforeSync Whether to drop the database before sync
   */
  public static async synchronize(
    dropBeforeSync: boolean = false
  ): Promise<void> {
    try {
      const dataSource = this.getDataSource();

      if (dropBeforeSync) {
        dbLogger.warn("Dropping database schema before sync");
        await dataSource.dropDatabase();
      }

      await dataSource.synchronize();
      dbLogger.info("Database schema synchronized successfully");
    } catch (error) {
      dbLogger.error(error, "Error synchronizing database schema");
      throw error;
    }
  }

  /**
   * Close db connection.
   */
  public static async close(): Promise<void> {
    if (DatabaseManager.dataSource?.isInitialized) {
      await DatabaseManager.dataSource.destroy();
      dbLogger.info("Database connection closed");
    }
  }

  /**
   * Creates db directory if it does not exist.
   */
  private static ensureDatabaseDirectory(): void {
    const dbDir = fileSystemService.getExternalPath("resources/db/");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }
}
