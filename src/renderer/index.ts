import {LaunchListView} from "./views/LaunchListView";
import Log from "../common/Log";
import "./styles/index.css";

Log.info("Render process for default view starting up.");

const app = document.getElementById("app") as HTMLDivElement;
new LaunchListView(app);
