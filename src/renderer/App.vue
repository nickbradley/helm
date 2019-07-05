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
      <component v-if="searchResults.length > 0" class="preview-pane" v-bind:item="activeItem" v-bind:is="previewComponent"></component>
    </div>
  </div>
</template>

<script lang="ts">
  import GroupedList from "./components/GroupedList.vue";
  import FilePreview from "./components/previews/FilePreview.vue";
  import WindowPreview from "./components/previews/WindowPreview.vue";
  import UrlPreview from "./components/previews/UrlPreview.vue";
  import ShellPreview from "./components/previews/ShellPreview.vue";
  import { ipcRenderer } from "electron";

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
        project: "kanboard"
      };
    },
    watch: {
      searchTerm: function() {
        const that: any = this;
        this.searching = true;
        that.partialSearch = that.searchTerm;
        if (that.inputTimer) {
          clearTimeout(that.inputTimer);
        }

        that.inputTimer = setTimeout(() => {
          if (that.partialSearch === that.searchTerm) {
            //Search term has stabilized here
            this.search();
          }
        }, 250);
      },
      project: function() {
        this.searching = true;
        this.search();
      }
    },
    mounted() {
      // Get the initial list of results (TODO This doesn't work)
      this.search();
      ipcRenderer.on("search-results", (event: any, arg: any) => {
        this.searching = false;
        (this as any).searchResults = arg;

      });
    },
    methods: {
      open: function(title: any) {
        console.log(`WindowAccelerator::open() - Opening window with title ${title}`);

      },
      onActive(item: any) {
        console.log("WindowAccelerator::onActive() - ", item);
        (this as any).activeItem = item;
      },
      onTrigger(window: any) {
        console.log("WindowAccelerator::onTrigger() - ", window);
      },
      onEnter() {
        // clear the input timer
        // make the search
        // focus the results (once they arrive)
      },
      search() {
        ipcRenderer.sendTo((this as any).backgroundWindowId, "search", {searchTerm: (this as any).searchTerm, project:this.project});
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
    margin:auto;
    /*color: #e5e5ea;*/
    color: lightgray            ;
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
