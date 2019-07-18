import Log from "electron-log";
import { Daemon } from "./Daemon";
// import * as path from "path";

(async () => {
  const appName = "helmd";
  // const home = process.env.HOME;
  // if (!home) {
  //   console.error("<FATAL> HOME env var not set.");
  //   process.exit(1);
  // }
  // const appData = path.join(home!, "Library/Application Support");
  // const userData = path.join(appData, appName);

  let daemon: Daemon;

  Log.transports.file.fileName = `${appName}.log`;
  process.title = appName;
  process.on("SIGTERM", async () => {
    let code = 0;
    if (daemon) {
      try {
        await daemon.stop();
      } catch (err) {
        Log.error(`Failed to stop daemon, forcing exit. ${err}`);
        code = 1;
      }
    }
    process.exit(code);
  });

  Log.info("Starting helm daemon process...");
  try {
    daemon = new Daemon();
    await daemon.start();
  } catch(err) {
    Log.error(`<FATAL> Failed to start the daemon process. ${err}`);
    process.exit(2);
  }
  Log.info(`Helm daemon process (${process.title} [${process.pid}]) started successfully.`);
})();