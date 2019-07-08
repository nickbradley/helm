import Log from "../backend/Log";

import Vue from "vue";
import * as AsyncComputed from "vue-async-computed";
// import all icons (use vue-awesome/icons/ICON_NAME to import specific icons)
import 'vue-awesome/icons'
import Icon from "vue-awesome/components/Icon.vue";
import * as fs from "fs";
import * as path from "path";
import { remote } from "electron";
import App from "./App.vue";
import { Daemon } from "../backend/Daemon";


function renderUI() {
  Log.info(`Starting Vue...`);

  Vue.use(AsyncComputed as any);
  Vue.component('v-icon', Icon);

  new Vue({
    el: "#app",
    render: h => h(App, {
      props: {backgroundWindowId: Number(new URLSearchParams(window.location.search).get("id"))}
    })
  });
}

async function startBackground() {
  Log.info("Starting helm daemon process...");

  let config: {[key: string]: any};
  const configFile = path.join(remote.app.getPath("userData"), "helmconfig.json");
  const dbPath = path.join(remote.app.getPath("userData"), "helm.db");

  try {
    Log.info(`Reading config file from ${configFile}`);
    config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  } catch (err) {
    Log.error(`<FATAL> Failed to read ${configFile}. Please ensure the file exists and is valid JSON.`);
    return;
  }

  const daemon = new Daemon(5600, dbPath, config["awPath"]);
  await daemon.start();

  window.addEventListener("unload", async () => {
    await daemon.stop();
  });

  Log.info("Helm daemon process is running.");
}


(async () => {
  Log.info(`Renderer process started.`);

  const renderType = new URLSearchParams(window.location.search).get("type");
  console.log("Starting with render type =", renderType);
  switch (renderType) {
    case "ui":
      renderUI();
      break;
    case "background":
      await startBackground();
      break;
  }
})();

