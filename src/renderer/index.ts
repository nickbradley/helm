import Vue from "vue";
import * as AsyncComputed from "vue-async-computed";
import App from "./App.vue";
import { DB } from "../common/DB";

Vue.use(AsyncComputed);

(async () => {
  await DB.connect();
  new Vue({
    el: '#app',
    render: h => h(App),
  });
})();