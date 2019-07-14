import Log from "../backend/Log";
import * as fs from "fs";

export class Config {
  public readonly managedTrackers: ManagedTrackersConfig;

  constructor(configFile: string) {
    Log.info(`Config() - Reading config file from ${configFile}`);
    let config: any;
    try {
      config = JSON.parse(fs.readFileSync(configFile, "utf8"));
    } catch (err) {
      Log.error(`Config() - Failed to read ${configFile}. Please ensure the file exists and is valid JSON.`);
      throw err;
    }

    if (!config["awPath"]) {
      throw new Error("Required config key 'awPath' is not set.");
    }
    this.managedTrackers = new ManagedTrackersConfig(config["awPath"]);

    if (!config["database"]) {
      throw
    }
  }
}

class ManagedTrackersConfig {
  public readonly binPath: string;

  constructor(binPath: string) {
    if (!binPath) {
      throw new Error("")
    }

    this.binPath = binPath;
  }
}
