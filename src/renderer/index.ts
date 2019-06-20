import Vue from "vue";
import * as AsyncComputed from "vue-async-computed";
import App from "./App.vue";
import { DB } from "../common/DB";
import Log from "../common/Log";

// @ts-ignore
Vue.use(AsyncComputed);

(async () => {
  Log.info(`Renderer process started.`);

  try {
    Log.info(`Connecting to database.`);
    await DB.connect();
  } catch (err) {
    Log.error(`Failed to connect to the database: ${err.message}`);
  }

  Log.info(`Starting Vue...`);
  new Vue({
    el: '#app',
    render: h => h(App),
  });
})();