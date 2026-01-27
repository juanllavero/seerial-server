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
import { Sequelize } from "sequelize-typescript";

const dbLogger = logger.child({ category: "Database" });

export class SequelizeManager {
  public static get DB_PATH(): string {
    return fileSystemService.getExternalPath("resources/db/data.db");
  }
  public static sequelize: Sequelize | null = null;

  /**
   * Initialize SQLite DB.
   */
  public static async initializeDB(): Promise<void> {
    if (this.sequelize) return;

    try {
      SequelizeManager.ensureDatabaseDirectory();

      // Initialize Sequelize
      SequelizeManager.sequelize = new Sequelize({
        database: "data",
        dialect: "sqlite",
        username: "root",
        password: "",
        storage: SequelizeManager.DB_PATH,
        models: [
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
        define: {
          underscored: true, // Map snake_case (DB) to camelCase (Models)
        },
        logging: false,
        // logging: (msg, timing) => {
        //   // Función de logging personalizada con Pino
        //   if (timing) {
        //     dbLogger.info({ sql: msg, duration: timing }, "Executed SQL query");
        //   } else {
        //     dbLogger.debug({ sql: msg }, "Sequelize log");
        //   }
        // },
      });

      // Enable foreign keys
      await SequelizeManager.sequelize.query("PRAGMA foreign_keys = ON;");

      // Enable write-ahead logging
      await SequelizeManager.sequelize.query("PRAGMA journal_mode = WAL;");

      // Set busy timeout
      await SequelizeManager.sequelize.query("PRAGMA busy_timeout = 5000;");

      // Set synchronous mode
      await SequelizeManager.sequelize.query("PRAGMA synchronous = NORMAL;");

      // Sync models to db
      await SequelizeManager.sequelize.sync({
        // alter: true,
        // force: true
      });

      dbLogger.info("Database initialized successfully with Sequelize");
    } catch (error: any) {
      throw new Error(
        `[Database Manager]: Database initialization failed: ${error.message}`
      );
    }
  }

  /**
   * Close db connection.
   */
  public static async close(): Promise<void> {
    if (SequelizeManager.sequelize) {
      await SequelizeManager.sequelize.close();
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
