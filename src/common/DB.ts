import { Connection, createConnection } from "typeorm";
import { Window } from "./entity/Window";

export class DB {
  private static connectionInstance: Connection;
  constructor() {

  }

  public static async connect(): Promise<Connection> {
    DB.connectionInstance = await createConnection({
      name: "sqlite",
      type: "sqlite",
      database: "/tmp/aaa.db",
      entities: [
        Window
      ],
      synchronize: true,
      logging: false
    });
    return DB.connectionInstance;
  }

  static get connection(): Connection {
    if (!DB.connectionInstance) {
      throw new Error("You must connect to the database.");
    }

    return DB.connectionInstance;
  }
}