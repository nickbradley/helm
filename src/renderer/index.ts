// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// import {DataManager} from "./DataManager";
// import {ResourceSearch} from "./models/ResourceSearch";
// import {LaunchListView} from "./views/LaunchListView";

// const dbPath = "/home/ncbradley/.local/share/activitywatch/aw-server/peewee-sqlite.v2.db";
// const dataManager = new DataManager(dbPath);
// const resourceSearch = new ResourceSearch(dataManager);
//
// const output = document.getElementById("output");
//
// const search = document.getElementById("txt-search") as HTMLInputElement;
// const searchInput = new SearchInput(search);
// const resultView = new ResultListView(output);
//
//
// const searchPresenter = new SearchPresenter(searchInput, resourceSearch, resultView);

// const body = document.getElementsByTagName("body")[0];
// const view = new LaunchListView(body);
// view.bind([{displayOrder: 1, text:"hello1"}, {displayOrder:2, text:"hello2"}]);
const h = document.createElement("h1");
h.innerText = "Hello!";
document.getElementById("app").appendChild(h);