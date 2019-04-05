<template>
    <ol>
        <icon-list-item
                v-for="file in files"
                v-bind:key="file.id"
                v-bind="file"
        ></icon-list-item>
    </ol>
</template>

<script>
  import IconListItem from "./IconListItem";

  export default {
    name: "FileAccelerator",
    components: { IconListItem },
    props: {
      searchText: String,
      context: Object,
    },
    computed: {
      files: function () {
        // TODO call the model getData method
        return [];
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