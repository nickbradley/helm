import Vue from "vue";
import * as AsyncComputed from "vue-async-computed";
import App from "./App.vue";
import { createConnection } from "typeorm";
// import { DB } from "../common/DB";

// Import the config explicitly so Webpack can see it
// import ormconfig from "../../ormconfig";

import {Application} from "../common/entities/Application";
import {Tracker} from "../common/entities/Tracker";
import {Window} from "../common/entities/Window";
import { Browser } from "../common/entities/Browser";

// @ts-ignore
Vue.use(AsyncComputed);

(async () => {
  // console.log(ormconfig);
  console.log(Application);
  try {
    await createConnection({
      "type": "sqlite",
      "database": `/home/ncbradley/.config/helm.db`,
      "entities": [
        Application,Tracker,Window, Browser
      ],
      "synchronize": true,
      "logging": "all",
      "logger": "simple-console"

    });
    // await DB.connect();
  } catch (err) {
    console.log("ERROR--", err);
  }
  new Vue({
    el: '#app',
    render: h => h(App),
  });
})();