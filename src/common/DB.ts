import { Connection, createConnection } from "typeorm";
import { Window } from "./entities/Window";
import { Application } from "./entities/Application";
import { Browser } from "./entities/Browser";
import { Editor } from "./entities/Editor";
import { Interaction } from "./entities/Interaction";
import { Shell } from "./entities/Shell";
import { Tracker } from "./entities/Tracker";
import { ProjectSession } from "./entities/ProjectSession";
import * as path from "path";
import { app, remote } from "electron";
import log from "electron-log";

export class DB {
  public static path: string;

  public static async connect(): Promise<Connection> {
    const isRenderer = (!process || typeof process === 'undefined' || process.type === 'renderer');
    let userData: string;
    if (isRenderer) {
      userData = remote.app.getPath("userData");
    } else {
      userData = app.getPath("userData");
    }
    const dbPath = path.join(userData, "helm.db");
    DB.path = dbPath;
    log.info(`DB::connect() - Connecting to ${dbPath}`);

    return createConnection({
      "type": "sqlite",
      "database": dbPath,
      "entities": [
        Application,
        Browser,
        Editor,
        Interaction,
        Shell,
        Tracker,
        Window,
        ProjectSession
      ],
      "synchronize": true,
      "logging": false,
      "logger": "simple-console"
    });
  }
}