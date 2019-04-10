<template>
  <ol>
    <icon-list-item
      v-for="browser  in browsers"
      v-bind:key="browser.id"
      v-bind="browser"
      v-bind:open="open.bind(this, browser.label)"
    ></icon-list-item>
  </ol>
</template>

<script lang="ts">
  import IconListItem from "./IconListItem.vue";
  import { Application } from "../../common/entities/Application";
  import { Browser } from "../../common/entities/Browser";

  export default {
    name: "UrlAccelerator",
    components: { IconListItem },
    props: {
      searchText: String,
      context: Object,
    },
    asyncComputed: {
      async browsers (): Promise<{title: string, icon: string}[]> {
        return Browser.createQueryBuilder()
          .leftJoinAndSelect("bucket", "bucket")
          // .leftJoin(Application, "app", "app.name = 'google-chrome'")
          .leftJoin(Application, "app", "app.name = case bucket.id when 'aw-watcher-web-firefox' then 'firefox' else 'google-chrome' end")
          .where("title like :search", {search: `%${(this as any).searchText}%`})
          .select("icon")
          .addSelect("title", "label")
          .getRawMany();
      }
    },
    methods: {
      open: function (using: string) {
        switch(using) {
          case "chrome":
            // TODO Open in chrome
            break;
          case "firefox":
            // TODO Open in firefox
            break;
          default:
            // TODO Just open with shell.openUrl()
            break;
        }
      }
    }
  };
</script>

<style scoped>

</style>