import { Connection, createConnection } from "typeorm";
import { Window } from "./entities/Window";
import { Application } from "./entities/Application";
import { Browser } from "./entities/Browser";
import { Editor } from "./entities/Editor";
import { Interaction } from "./entities/Interaction";
import { Shell } from "./entities/Shell";
import { Tracker } from "./entities/Tracker";
import { ProjectSession } from "./entities/ProjectSession";
import Log from "electron-log";
import { ActiveProject} from "./entities/ActiveProject";
import { Usage } from "./entities/Usage";

export class Database {
  public readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  public async connect(): Promise<Connection> {
    Log.info(`DB::connect() - Connecting to ${this.path}`);

    return createConnection({
      "type": "sqlite",
      "database": this.path,
      "entities": [
        Application,
        Browser,
        Editor,
        Interaction,
        ActiveProject,
        Shell,
        Tracker,
        Window,
        ProjectSession,
        Usage,
      ],
      "synchronize": true,
      "logging": false,
      "logger": "file",
      // maxQueryExecutionTime: 1000
    });
  }
}