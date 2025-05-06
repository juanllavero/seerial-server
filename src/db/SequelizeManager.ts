import fs from 'fs';
import { Sequelize } from 'sequelize-typescript';
import {
  Album,
  AlbumArtist,
  Artist,
  Collection,
  CollectionAlbum,
  CollectionMovie,
  CollectionSeries,
  ContinueWatching,
  Episode,
  Library,
  Movie,
  MyList,
  PlayList,
  PlayListItem,
  Season,
  Series,
  Song,
  Video,
} from '../data/models';
import { FilesManager } from '../utils/FilesManager';

export class SequelizeManager {
  public static DB_PATH: string = FilesManager.getExternalPath(
    'resources/db/data.db'
  );
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
        database: 'data',
        dialect: 'sqlite',
        username: 'root',
        password: '',
        storage: SequelizeManager.DB_PATH,
        models: [
          Collection,
          CollectionAlbum,
          CollectionMovie,
          CollectionSeries,
          ContinueWatching,
          Episode,
          Library,
          Movie,
          MyList,
          PlayList,
          PlayListItem,
          Season,
          Series,
          Video,
          Album,
          AlbumArtist,
          Artist,
          Song,
        ],
        define: {
          underscored: true, // Map snake_case (DB) to camelCase (Models)
        },
        logging: (msg) => console.log(msg),
      });

      // Enable foreign keys
      await SequelizeManager.sequelize.query('PRAGMA foreign_keys = ON;');

      // Sync models to db
      await SequelizeManager.sequelize.sync({ alter: true });

      console.log('Database initialized successfully with Sequelize');
    } catch (error: any) {
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Close db connection.
   */
  public static async close(): Promise<void> {
    if (SequelizeManager.sequelize) {
      await SequelizeManager.sequelize.close();
      console.log('Database connection closed');
    }
  }

  /**
   * Creates db directory if it does not exist.
   */
  private static ensureDatabaseDirectory(): void {
    const dbDir = FilesManager.getExternalPath('resources/db/');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }
}
