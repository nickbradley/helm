import { Connection, createConnection } from "typeorm";
import { Window } from "./entities/Window";
import { Application } from "./entities/Application";
import { Browser } from "./entities/Browser";
import { Editor } from "./entities/Editor";
import { Interaction } from "./entities/Interaction";
import { Shell } from "./entities/Shell";
import { Tracker } from "./entities/Tracker";

export class DB {
  public static async connect(database: string): Promise<Connection> {
    return createConnection({
      "type": "sqlite",
      "database": database,
      "entities": [
        Application,
        Browser,
        Editor,
        Interaction,
        Shell,
        Tracker,
        Window
      ],
      "synchronize": true,
      "logging": false,
      "logger": "simple-console"
    });
  }
}