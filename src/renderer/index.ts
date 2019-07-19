import Vue from "vue";
import * as AsyncComputed from "vue-async-computed";
import "vue-awesome/icons" // import all icons (use vue-awesome/icons/ICON_NAME to import specific icons)
import Icon from "vue-awesome/components/Icon.vue";
import App from "./App.vue";
import Log from "electron-log";

(async () => {
  Log.transports.file.fileName = "ui.log";
  Log.info(`Starting Vue...`);

  Vue.use(AsyncComputed as any);
  Vue.component('v-icon', Icon);

  new Vue({
    el: "#app",
    render: h => h(App)
  });
})();

