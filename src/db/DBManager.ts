import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { FilesManager } from "../utils/FilesManager";
import { schemaSQL } from "./schema";

export class DBManager {
  public static db: any;
  public static DB_PATH: string = FilesManager.getExternalPath(
    "resources/db/data.db"
  );

  public static async initializeDatabase() {
    try {
      // Open SQLite database
      this.db = await open({
        filename: this.DB_PATH,
        driver: sqlite3.Database,
      });

      // Enable foreign keys
      await this.db.exec("PRAGMA foreign_keys = ON;");

      // Execute schema to create tables if they don't exist
      await this.db.exec(schemaSQL);

      console.log("Database initialized successfully");
    } catch (error: any) {
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  public static async closeDatabase() {
    if (this.db) {
      await this.db.close();
    }
  }

  public static async executeQuery(query: string) {
    if (!this.db) {
      await this.initializeDatabase();
    }

    if (this.db && query !== "") {
      return await this.db.all(query);
    }
  }
}
