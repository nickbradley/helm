import { Database } from "./Database";
import { Server } from "./Server";
import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import * as fs from "fs-extra";
import Log from "electron-log";
import { ProjectWatcher } from "./ProjectWatcher";
import { ContextModel } from "./ContextModel";

export class Daemon {
  public readonly restPort: number;
  public readonly dbPath: string;
  public readonly awPath: string;
  public readonly projects: {[name: string]: any};
  public readonly projectWatcher: ProjectWatcher;
  public readonly contextModel: ContextModel;

  private db: Database;
  private server: Server;
  private windowWatcher!: ChildProcess;
  private afkWatcher!: ChildProcess;

  private canCollectData: boolean;

  constructor() {
    Log.info(`Daemon::init() - Initializing process.`);

    this.restPort = Number(process.env.PORT) || 5600;

    if (!process.env.DB_PATH) {
      throw new Error("Required env var DB_PATH is not set.");
    }
    this.dbPath = process.env.DB_PATH;

    if (!process.env.AW_PATH) {
      throw new Error("Required env var AW_PATH is not set.");
    }
    this.awPath = process.env.AW_PATH;
    // TODO make this configurable from the env
    this.projects = {
      helm: {
        root: "/Users/Shared/helm",
      },
      kanboard: {
        root: "/Users/studyparticipant/projects/kanboard",
      },
      teammates: {
        root: "/Users/studyparticipant/projects/teammates",
      },
    };

    this.db = new Database(this.dbPath);
    this.server = new Server(this, "HelmWatcher");
    // TODO ProjectWatcher can probably be merged with ContextModel...
    this.projectWatcher = new ProjectWatcher(Object.keys(this.projects));
    this.contextModel = new ContextModel(this.projects);

    this.canCollectData = true;
  }

  public dataCollectionStatus() {
    return this.canCollectData ? "running" : "paused";
  }

  public async start() {
    Log.info(`Daemon::start() - Connecting to database.`);
    await this.db.connect();

    await this.contextModel.init();

    Log.info(`Daemon::start() - Starting ActivityWatch-compatible REST server.`);
    await this.server.start(this.restPort);

    Log.info(`Daemon::start() - Starting hosted watchers.`);
    await this.startWatchers();
  }

  public async stop() {
    Log.info(`Daemon::stop() - Stopping hosted watchers.`);
    // TODO Check if there was an error that already kill process (so we don't inadvertently kill some random process)
    this.windowWatcher.kill("SIGINT");
    this.afkWatcher.kill("SIGINT");

    Log.info(`Daemon::stop() - Stopping REST server.`);
    await this.server.stop();
  }

  public pauseDataCollection() {
    this.canCollectData = false;
  }

  public resumeDataCollection() {
    this.canCollectData = true;
  }

  private async startWatchers() {
    // We need to remove queued events before startup otherwise aw-watcher-* won't try to create a new bucket which is
    // probably needed since the name depends on the hostname (which seems to change based on network).
    await fs.emptyDir(`${process.env["HOME"]}/Library/Application Support/activitywatch/aw-client/queued`);

    this.windowWatcher = spawn(path.join(this.awPath, "aw-watcher-window"));
    this.windowWatcher.on("error", (code: number) => {
      Log.error(`aw-watcher-window failed unexpectedly with code ${code}.`);
    });
    this.windowWatcher.stdout!.on("data", (data) => {
      Log.verbose(`aw-watcher-window (stdout): ${data}`);
    });
    this.windowWatcher.stderr!.on("data", (data) => {
      Log.verbose(`aw-watcher-window (stderr): ${data}`);
    });

    // TODO I think this slows everything down... (don't need it for the study)
    // this.afkWatcher = spawn(path.join(this.awPath, "aw-watcher-afk"));
    // this.afkWatcher.on("error", (code: number) => {
    //   Log.error(`aw-watcher-afk failed unexpectedly with code ${code}.`);
    // });
  };
}

