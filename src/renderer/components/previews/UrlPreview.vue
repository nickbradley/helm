<template>
  <webview v-bind:src="file.url"></webview>
</template>

<script>
  export default {
    name: "UrlPreview",
    props: {
      file: Object
    }
  };
</script>

<style scoped>

</style>