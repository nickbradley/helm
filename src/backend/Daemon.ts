import { Database } from "./Database";
import { Server } from "./Server";
import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import { ContextModel } from "./ContextModel";
import {ipcRenderer} from "electron";
import * as fs from "fs-extra";
import Log from "electron-log";
// import { Platform } from "../common/Platform";
// import { Application } from "./entities/Application";
// import { getRepository } from "typeorm";

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

  // /*  TODO Report this as a TypeORM bug...
  //   After considerable time I figured out why `getRepository(Application).insert(appEntities)` causes a seg fault: it freakin' escapes column names with double-quotes instead of single-quotes!
  //   Not sure why the sqlite3 doesn't catch this (or convert them).
  //
  //   If you turn on logging and try to insert a single record you'll see the generate query is `INSERT INTO "application"("identifier", "name", "icon", "path") VALUES (?, ?, ?, ?) -- PARAMETERS: ["com.apple.Notes","Notes","","/Applications/Notes.app"]`
  //   You can reproduce using `getRepository(Application).query(`insert into "application"("identifier", "name", "icon", "path") values (?,?,?,?)`, [application.identifier, application.name, application.icon, application.path])`
  //  */
  // private async loadHostApplications() {
  //   const applications = Platform.listApplications();
  //   const appEntities: Application[] = [];
  //   const appRepo = getRepository(Application);
  //
  //   // Log.verbose(`loadHostApplications() - Clearing existing application data...`);
  //   // await appRepo.clear();
  //   // await appRepo.query(`delete from 'application'`);
  //
  //
  //   for (const app of applications) {
  //     const application = new Application();
  //     application.identifier = app.id;
  //     application.name = app.name;
  //     application.icon = app.icon;
  //     application.path = app.path;
  //
  //     const duplicates = appEntities.filter(e => e.identifier === application.identifier);
  //     if (duplicates.length >= 1) {
  //       Log.warn(`loadHostApplications() - Skipping duplicate application. Inserted: ${JSON.stringify(duplicates[0])}; Duplicate: ${application}`);
  //     } else {
  //       Log.verbose(`loadingHostApplications() - Loading application data: ${application}`);
  //       await appRepo.query(`insert into 'application'('identifier', 'name', 'icon', 'path') values (?,?,?,?)`, [application.identifier, application.name, application.icon, application.path]);
  //       appEntities.push(application);
  //     }
  //   }
  // }
}

