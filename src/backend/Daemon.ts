import { Database } from "./Database";
import { Server } from "./Server";
import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import { ContextModel } from "./ContextModel";
import {ipcRenderer} from "electron";
import * as fs from "fs";
import Log from "electron-log";

export class Daemon {
  public readonly restPort: number;
  public readonly dbPath: string;
  public readonly awPath: string;

  private db: Database;
  private model: ContextModel;
  private server: Server;
  private windowWatcher!: ChildProcess;
  private afkWatcher!: ChildProcess;

  private canCollectData: boolean;

  constructor(configFile: string) {
    Log.info(`Daemon::init() - Initializing process.`);

    let config: {[key: string]: any};
    try {
      Log.info(`Reading config file from ${configFile}`);
      config = JSON.parse(fs.readFileSync(configFile, "utf8"));
    } catch (err) {
      Log.error(`<FATAL> Failed to read ${configFile}. Please ensure the file exists and is valid JSON.`);
      throw err;
    }

    this.restPort = 5600;
    this.dbPath = config["dbPath"];  // /Users/ncbrad/Library/Application Support/helm-dev/helm.db
    this.awPath = config["awPath"];

    this.db = new Database(this.dbPath);
    this.model = new ContextModel(config["projects"]);
    this.server = new Server("HelmWatcher");

    this.canCollectData = true;
  }

  public dataCollectionStatus() {
    return this.canCollectData ? "running" : "paused";
  }

  public async start() {
    Log.info(`Daemon::start() - Connecting to database.`);
    await this.db.connect();

    // Log.info(`Daemon::start() - Getting information about installed applications.`);
    // await this.loadHostApplications();

    Log.info(`Daemon::start() - Starting ActivityWatch-compatible REST server.`);
    await this.server.start(this.restPort);

    Log.info(`Daemon::start() - Starting hosted watchers.`);
    await this.startWatchers();

    ipcRenderer.on("search", async (event: any, args: any) => {
      const results = await this.model.search(args);
      ipcRenderer.sendTo(event.senderId, "search-results", results);
    });
  }

  public async stop() {
    Log.info(`Daemon::stop() - Stopping hosted watchers.`);
    // TODO Check if there was an error that already kill process (so we don't
    // inadvertently kill some random process
    this.windowWatcher.kill("SIGINT");
    this.afkWatcher.kill("SIGINT");

    Log.info(`Daemon::stop() - Stopping REST server.`);
    await this.server.stop();

    Log.info("Daemon::stop() - Removing event listeners.");
    ipcRenderer.removeAllListeners("search");
  }

  public pauseDataCollection() {
    this.canCollectData = false;
  }

  public resumeDataCollection() {
    this.canCollectData = true;
  }

  private async startWatchers() {
    this.windowWatcher = spawn(path.join(this.awPath, "aw-watcher-window"));
    this.windowWatcher.on("error", (code: number) => {
      Log.error(`aw-watcher-window failed unexpectedly with code ${code}.`);
    });

    this.afkWatcher = spawn(path.join(this.awPath, "aw-watcher-afk"));
    this.afkWatcher.on("error", (code: number) => {
      Log.error(`aw-watcher-afk failed unexpectedly with code ${code}.`);
    });
  };


}

