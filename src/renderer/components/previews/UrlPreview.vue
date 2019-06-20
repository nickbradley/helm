<template>
  <webview v-bind:src="item.url"></webview>
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