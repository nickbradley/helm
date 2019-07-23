import Log from "electron-log";
import { Daemon } from "./Daemon";

(async () => {
  const appName = "helmd";
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
  Log.info(`Helm daemon process started successfully: ${process.title} [${process.pid}]`);
})();