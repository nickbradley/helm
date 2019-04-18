<template>
    <ol>
        <icon-list-item
                v-for="window in windows"
                v-bind:key="window.id"
                v-bind="window"
                v-bind:open="open.bind(this, window.label)"
        ></icon-list-item>
    </ol>
</template>

<script lang="ts">
  import { Window } from "../../common/entities/Window";
  import IconListItem from "./IconListItem.vue";
  // import { createQueryBuilder } from "typeorm";
  import { Application } from "../../common/entities/Application";
  import { Platform } from "../../common/Platform";

  export default {
    name: "WindowAccelerator",
    components: { IconListItem },
    props: {
      searchText: String,
      context: Object,
    },
    asyncComputed: {
      async windows (): Promise<{title: string, icon: string}[]> {
        return Window.createQueryBuilder()
          .leftJoin(Application, "app", "app.name = lower(window.app)")
          .where("title like :search", {search: `%${(this as any).searchText}%`})
          .select("icon")
          .addSelect("title", "label")
          .getRawMany();
      }
    },
    methods: {
      open: function (title: string) {
        const window = Platform.listWindows().filter((w) => w.title === title)[0];
        if (window) {
          Platform.activateWindow(window.identifier);
        }
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
