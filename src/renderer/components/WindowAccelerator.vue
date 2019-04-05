<template>
    <ol>
        <icon-list-item
                v-for="window in windows"
                v-bind:key="window.id"
                v-bind="window"
                v-bind:open="open"
        ></icon-list-item>
    </ol>
</template>

<script>
  import { DB } from "../../common/DB";
  import { Window } from "../../common/entity/Window";
  import IconListItem from "./IconListItem";

  export default {
    name: "WindowAccelerator",
    components: { IconListItem },
    props: {
      searchText: String,
      context: Object,
    },
    data: function() {
        return {}
    },
    computed: {
      lookup: function() {
        const obj = {
          "apple": 1,
          "pear": 2,
          "peach": 3
        };
        let result = "No match";
        for (const [key, value] of Object.entries(obj)) {
          if (key.startsWith(this.searchText)) {
            result = value;
          }
        }
        return result;
      }
    },
    asyncComputed: {
      async windows () {
        // TODO Call model to get results from the DB
        console.log(this.searchText);
        // const windows = [
        //   {id: 1, icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==", label: "result 1", open: () => console.log("I would open something")},
        //   {id: 2, icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==", label: "result 2", open: () => console.log("I would open 2")},
        //   {id: 3, icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==", label: "result 3", open: () => console.log("I would open 3")}
        // ];
        const windows = await DB.connection.manager.find(Window);
        //DB.connection.manager.find(Window).then(console.log).catch(console.error);
        console.log(windows);
        return windows;
      }
    },
    methods: {
      open: function () {
        console.log("Open Window!");
      }
    }
  };
</script>

<style scoped>
  ol {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }
</style>
