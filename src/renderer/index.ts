import Vue from "vue";
import * as AsyncComputed from "vue-async-computed";
import "vue-awesome/icons" // import all icons (use vue-awesome/icons/ICON_NAME to import specific icons)
import Icon from "vue-awesome/components/Icon.vue";
// import * as path from "path";
// import { remote } from "electron";
import App from "./App.vue";
// import { Daemon } from "../backend/Daemon";
import Log from "electron-log";


function renderUI() {
  Log.transports.file.fileName = "ui.log";
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
  // Log.transports.file.fileName = "background.log";
  // Log.info("Starting helm daemon process...");
  //
  // const configFile = path.join(remote.app.getPath("userData"), "helmconfig.json");
  // const daemon = new Daemon(configFile);
  // await daemon.start();
  //
  // window.addEventListener("unload", async () => {
  //   await daemon.stop();
  // });
  //
  // Log.info("Helm daemon process is running.");
}


(async () => {
  const renderType = new URLSearchParams(window.location.search).get("type");
  switch (renderType) {
    case "ui":
      renderUI();
      break;
    case "background":
      await startBackground();
      break;
  }
})();

