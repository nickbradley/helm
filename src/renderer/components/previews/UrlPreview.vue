<template>
  <webview v-bind:src="item.url" tabindex="-1"></webview>
</template>

<script>
  export default {
    name: "UrlPreview",
    props: {
      item: Object
    }
  };
</script>

<style scoped>

</style>