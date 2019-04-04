<template>
    <div>
        <div id="input-view">
            <Search
                v-model="searchText"
                placeholder="Type to search..."
                @keydown=""
            ></Search>
        </div>

        <div id="tab-view">
            <accelerator-tabs
              v-bind:tabs="tabs"
              v-bind:search-text="searchText"
            ></accelerator-tabs>
        </div>
    </div>
</template>

<script>
    import Search from "./Search.vue"
    import AcceleratorTabs from "./components/AcceleratorTabs.vue"

  export default {
      components: {
        Search,
        AcceleratorTabs
      },

    data: function () {
        return {
          searchText: "",
          tabs:[
            {
              component: "WindowAccelerator",
              icon: ""
            },
            {
              component: "FileAccelerator",
              icon: ""
            },
            {
              component: "ShellAccelerator",
              icon: ""
            },
            {
              component: "UrlAccelerator",
              icon: ""
            },
          ]
        }
    },
    methods: {
        input() {
          console.log(this.searchText);
        }
    }
  }
</script>

<style>
    .example {
        color: red;
    }
</style>