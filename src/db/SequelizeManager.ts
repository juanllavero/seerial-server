import { Sequelize } from "sequelize-typescript";
import { DBManager } from "./DBManager";

export class SequelizeManager {
  static sequelize = new Sequelize({
    database: "data",
    dialect: "sqlite",
    username: "root",
    password: "",
    storage: DBManager.DB_PATH,
    models: [__dirname + "../data/models/**/*.model.ts"],
  });
}
