<template>
  <div>
    <div class="inner-addon">
      <label>
        <v-icon v-if="searching" name="spinner" spin/>
        <v-icon v-else name="search"/>
        <select id="select-project" v-model="project">
          <option v-for="project in projects" v-bind:value="project">{{project}}</option>
        </select>
        <input type="text" autofocus class="input" v-model="searchTerm" v-on:keyup.enter="onEnter"/>
      </label>

    </div>
    <div class="wrapper">
      <GroupedList class="list-pane" v-on:active="onActive" v-on:trigger="onTrigger"
                   v-bind:items="searchResults"></GroupedList>
      <component v-if="searchResults.length > 0" class="preview-pane" v-bind:item="activeItem"
                 v-bind:is="previewComponent"></component>
    </div>
  </div>
</template>

<script lang="ts">
  import GroupedList from "./components/GroupedList.vue";
  import FilePreview from "./components/previews/FilePreview.vue";
  import WindowPreview from "./components/previews/WindowPreview.vue";
  import UrlPreview from "./components/previews/UrlPreview.vue";
  import ShellPreview from "./components/previews/ShellPreview.vue";
  import { ipcRenderer, shell } from "electron";
  import { Platform } from "../common/Platform";
  import { ChildProcess, spawn } from "child_process";
  import * as fs from "fs";
  import { stripIndent } from "common-tags";
  import Log from "electron-log";
  import * as http from "http";

  export default {
    name: "App",
    components: {
      GroupedList,
      FilePreview,
      WindowPreview,
      UrlPreview,
      ShellPreview
    },
    props: {
      backgroundWindowId: Number
    },
    data: function() {
      return {
        searchTerm: "",
        searchResults: [],
        activeItem: {},
        partialSearch: null,
        inputTimer: null,
        searching: false,
        projects: ["kanboard", "teammates", "helm"],
        project: "helm"
      };
    },
    watch: {
      searchTerm: function() {
        const that: any = this;
        (this as any).searching = true;
        that.partialSearch = that.searchTerm;
        if (that.inputTimer) {
          clearTimeout(that.inputTimer);
        }

        that.inputTimer = setTimeout(() => {
          if (that.partialSearch === that.searchTerm) {
            //Search term has stabilized here
            (this as any).search();
          }
        }, 250);
      },
      project: function() {
        (this as any).searching = true;
        (this as any).search();
      }
    },
    mounted() {
      console.log("App mounted");
      // ipcRenderer.on("search-results", (event: any, arg: any) => {
      //   (this as any).searching = false;
      //   (this as any).searchResults = arg;
      //
      // });
      ipcRenderer.on("window-focused", () => {
        if ((this as any).searchTerm !== "") {
          (this as any).$el.getElementsByTagName("input")[0].value = "";
          (this as any).searchTerm = "";
        } else {
          (this as any).search();
          (this as any).searching = true;
        }
      });
      // // Get the initial list of results (TODO This doesn't work)
      // (this as any).search();
      // (this as any).searching = true;
    },
    methods: {
      open: function(title: any) {
        console.log(`WindowAccelerator::open() - Opening window with title ${title}`);

      },
      onActive(item: any) {
        console.log("WindowAccelerator::onActive() - ", item);
        (this as any).activeItem = item;
      },
      onTrigger(item: any) {
        console.log("WindowAccelerator::onTrigger() - ", window);

        const usage = {
          created: new Date(),
          kind: "launch",
          action: "",
          resource: ""
        };

        switch ((this as any).activeItem.group) {
          case "file":
            console.log("FILE TRIGGERED", item);
            // description, group, icon, relevance, title, path

            let tracker = "unknown";
            if (item.custom && item.custom.tracker) {
              tracker = item.custom.tracker;
            }

            let subprocess: ChildProcess | undefined;
            switch (tracker) {
              case "aw-watcher-idea":
                usage.action = "spawn";
                usage.resource = `/usr/local/bin/idea ${item.path}`;
                Log.verbose(`WindowAccelerator::onTrigger() - Running /usr/local/bin/idea ${item.path}.`);
                subprocess = spawn("/usr/local/bin/idea", [item.path], { detached: true, stdio: "ignore" });
                break;
              case "aw-watcher-vscode":
                // VS Code needs the path split into project and file to open as desired.
                usage.action = "spawn";
                usage.resource = `/usr/local/bin/code ${item.custom.project} ${item.custom.file}`;
                Log.verbose(`WindowAccelerator::onTrigger() - Running /usr/local/bin/code ${item.custom.project} ${item.custom.file}.`);
                subprocess = spawn("/usr/local/bin/code", [item.custom.project, item.custom.file], {
                  detached: true,
                  stdio: "ignore"
                });
                break;
              default:
                shell.showItemInFolder(item.path);
            }

            if (subprocess) {
              subprocess.unref();
            }
            break;
          case "window":
            console.log("WINDOW TRIGGERED", item);
            // description, group, icon, relevance, title
            usage.action = "activateWindow";
            usage.resource = item.description;
            Platform.activateWindow(item.description);
            break;
          case "website":
            console.log("WEBSITE TRIGGERED", item);
            // description, group, icon, relevance, title, url
            usage.action = "openExternal";
            usage.resource = item.url;
            shell.openExternal(item.url);
            break;
          case "shell session":
            console.log("SHELL TRIGGERED", item);
            // description, group, icon, relevance, title, commands: cmd, code, cwd, duration, isSelected

            const scriptPath = `/tmp/${Date.now()}`;

            let cwd: string = "";
            const commands: string[] = [];
            const selectedCommands = item.commands.filter((command: any) => command.isSelected);
            for (const command of selectedCommands) {
              if (command.cwd !== cwd) {
                commands.push(`cd ${command.cwd}`);
                cwd = command.cwd;
              }
              commands.push(command.cmd);
            }

            const script = stripIndent`
            #!/bin/bash
            set -x
            ${commands.join(" && ")}
            `;

            fs.writeFile(scriptPath, script, { mode: 0o544 }, (err) => {
              spawn("open", ["-a", "Terminal", scriptPath], { detached: true, stdio: "ignore" }).unref();
            });
            usage.action = "spawn";
            usage.resource = script;
            break;
        }

        // POST to helmd
        const data = JSON.stringify(usage);
        const options = {
          hostname: "localhost",
          port: 5600,
          path: "/api/0/usage/launch",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length
          }
        };
        const req = http.request(options, (res) => {
          console.log(`statusCode: ${res.statusCode}`);

          res.on("data", (d) => {
            process.stdout.write(d);
          });
        });
        req.on("error", (error) => {
          console.error(error);
        });
        req.write(data);
        req.end();


      },
      onEnter() {
        // clear the input timer
        // make the search
        // focus the results (once they arrive)
      },
      search() {
        // ipcRenderer.sendTo((this as any).backgroundWindowId, "search", {
        //   searchTerm: (this as any).searchTerm,
        //   project: (this as any).project
        // });
        const url = `http://127.0.0.1:5600/api/0/artifacts?contains=${(this as any).searchTerm}&project=${(this as any).project}`;
        Log.verbose(`Making request: ${url}`);
        http.get(url, (res) => {
          const { statusCode } = res;
          const contentType = res.headers["content-type"] || "";

          let error;
          if (statusCode !== 200) {
            error = new Error("Request Failed.\n" +
              `Status Code: ${statusCode}`);
          } else if (!/^application\/json/.test(contentType)) {
            error = new Error("Invalid content-type.\n" +
              `Expected application/json but received ${contentType}`);
          }
          if (error) {
            Log.error(error.message);
            // consume response data to free up memory
            res.resume();
            return;
          }

          res.setEncoding("utf8");
          let rawData = "";
          res.on("data", (chunk) => {
            rawData += chunk;
          });
          res.on("end", () => {
            try {
              const parsedData = JSON.parse(rawData);
              Log.info(parsedData);
              (this as any).searching = false;
              (this as any).searchResults = parsedData;
            } catch (e) {
              Log.error(e.message);
            }
          });
        }).on("error", (e) => {
          Log.error(`Got error: ${e.message}`);
        });
      }
    },
    computed: {
      previewComponent: function() {
        let component;

        switch ((this as any).activeItem.group) {
          case "file":
            component = "FilePreview";
            break;
          case "window":
            component = "WindowPreview";
            break;
          case "website":
            component = "UrlPreview";
            break;
          case "shell session":
            component = "ShellPreview";
            break;
        }
        return component;
      }
    }
  };
</script>

<style>
  body {
    margin: 0;
    height: 100vh;
    overflow: hidden;
  }

  .inner-addon {
    position: relative;
  }

  .wrapper {
    display: flex;
    overflow: hidden;
    /* This is a total hack to fix the height of the accelerator window so that the max height is set and scrollbars
       will appear. https://stackoverflow.com/a/22934372
     */
    height: calc(100vh - 60px);
  }

  .list-pane {
    flex: 0 0 40%;
    overflow-x: hidden;
    overflow-y: scroll;
  }

  .preview-pane {
    flex: 1;
    overflow: auto;
    display: flex;
    height: 100%;
    flex-direction: column;
  }

  .centered {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    flex-direction: column;
    color: gray;
  }

  label {
    position: relative;
  }

  label > .fa-icon {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 1em;
    /*transform: translateY(-50%);*/
    margin: auto;
    /*color: #e5e5ea;*/
    color: lightgray;
  }

  label > select {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 8em;;
    right: 8em;
    margin: auto;
    background: none;
    color: gray;
  }


  label > input {
    padding-left: calc(1.6em + 1em + 2px); /* icon width + icon padding-left + desired separation*/
    height: 2em;
    width: 100%;
    font-size: 1.6em;
  }

  .fa-icon {
    display: inline-block;
    width: 1.6em;
    height: 1.6em;
    stroke-width: 0;
    stroke: currentColor;
    fill: currentColor;
  }

</style>
