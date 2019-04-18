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
    created: function () {
      window.addEventListener("keyup", this.keyup)
    },
    methods: {
      keyup: function (event: any) {
        switch (event.key) {
          case "ArrowDown":
            this.$root.$emit("navDown");
            break;
          case "ArrowUp":
            this.$root.$emit("navUp");
            break;
          case "ArrowLeft":
            this.$root.$emit("navLeft");
            break;
          case "ArrowRight":
            this.$root.$emit("navRight");
            break;
          case "Enter":
            this.$root.$emit("enter");
            break;
        }
      }
    },
    render: h => h(App),
  });
})();