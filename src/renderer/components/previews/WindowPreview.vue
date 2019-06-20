<template>
  <div class="centered">
    <img v-if="file.screenshot" v-bind:src="this.file.screenshot" class="screenshot"/>
    <img v-else v-bind:src="this.file.icon"/>
    <p class="icon-caption">{{this.file.text.main}}</p>
  </div>
</template>

<script>
  export default {
    name: "WindowPreview",
    props: {
      file: Object
    }
  };
</script>

<style scoped>
  div >>> img {
    object-fit: contain;
    height: 128px;
  }

  div >>> .icon-caption {
    color: initial;
    font-size: larger;
  }

  div >>> .screenshot {
    height: unset;
    max-height: 80%;
    max-width: 80%;
    object-fit: contain;
  }
</style>