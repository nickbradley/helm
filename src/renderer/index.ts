// import {LaunchListView} from "./views/LaunchListView";
// import Log from "../common/Log";
// import "./styles/index.css";
//
// Log.info("Render process for default view starting up.");
//
// const app = document.getElementById("app") as HTMLDivElement;
// new LaunchListView(app);

import Vue from "vue";
import App from "./App.vue";

new Vue({
  el: '#app',
  render: h => h(App),

});