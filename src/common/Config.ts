import Log from "../backend/Log";
import * as fs from "fs";

export class Config {
  public readonly managedTrackers: ManagedTrackersConfig;
  public readonly database: DatabaseConfig;

  constructor(configFile: string) {
    Log.info(`Config() - Reading config file from ${configFile}`);
    let opts: any;
    try {
      opts = JSON.parse(fs.readFileSync(configFile, "utf8"));
    } catch (err) {
      Log.error(`Config() - Failed to read ${configFile}. Please ensure the file exists and is valid JSON.`);
      throw err;
    }


    this.managedTrackers = new ManagedTrackersConfig(opts["managedTrackers"]);
    this.database = new DatabaseConfig(opts["database"]);
  }
}

interface ManagedTrackersOptions {
  binPath: string;
}

class ManagedTrackersConfig implements ManagedTrackersOptions {
  public readonly binPath: string;

  constructor(opts: ManagedTrackersOptions) {
    if (!opts) {
      throw new Error("ManagedTrackersConfig() - 'opts' parameter is undefined.");
    }

    if (!opts["binPath"]) {
      throw new Error("ManagedTrackersConfig() - 'managedTrackers.binPath' is not defined.");
    }

    this.binPath = opts["binPath"];
  }
}


interface DatabaseOptions {
  path: string;
}

class DatabaseConfig implements DatabaseOptions {
  public readonly path: string;

  constructor(opts: DatabaseOptions) {
    if (!opts) {
      throw new Error("DatabaseConfig() - 'opts' parameter is undefined.");
    }

    if (!opts["path"]) {
      throw new Error("DatabaseConfig() - 'database.path' is not defined.");
    }

    this.path = opts["path"];
  }
}

// interface WatchedProjectsOptions {
//   [projectName: string]: {
//     root: string;
//   }
// }
