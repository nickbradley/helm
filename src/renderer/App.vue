<template>
  <div>
    <Search v-model="searchText"></Search>
    <accelerator-tabs v-bind:tabs="accelerators" v-bind:search-text="searchText"></accelerator-tabs>
  </div>
</template>

<script lang="ts">
  import FileAccelerator from "./components/accelerators/FileAccelerator.vue"
  import Search from "./components/Search.vue"
  import AcceleratorTabs from "./components/AcceleratorTabs.vue";

  export default {
    name: "App",
    components: {
      AcceleratorTabs,
      FileAccelerator,
      Search
    },
    data () {
      return {
        searchText: "",
        accelerators: [
          {component: "WindowAccelerator", name: "Windows"},
          {component: "FileAccelerator", name: "Files"},
          {component: "UrlAccelerator", name: "Web"},
          {component: "ShellAccelerator", name: "Shell"},
        ]
      }
    }
  }
</script>

<style>
  body {
    margin: 0;
    height: 100vh;
    overflow: hidden;

  }

  .input {
    height: 52px;
  }
  .accelerator-tabs > ul {
    height: 44px;
  }
  .accelerator-tabs {
    /* This is a total hack to fix the height of the accelerator window so that the max height is set and scrollbars
       will appear. 116 = 52 input + 64 tab bar (44 + 16 margin + 2 border). https://stackoverflow.com/a/22934372
     */
    height: calc(100vh - 116px);
  }
</style>