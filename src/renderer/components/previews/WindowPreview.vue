<template>
  <div class="centered">
    <img v-if="window.screenshot" v-bind:src="this.window.screenshot" class="screenshot"/>
    <img v-else v-bind:src="this.window.icon"/>
    <p class="icon-caption">{{this.window.title}}</p>
  </div>
</template>

<script>
  export default {
    name: "WindowPreview",
    props: {
      item: Object
    },
    computed: {
      window() {
        // alias the item prop https://github.com/vuejs/vue/issues/7943
        return this.item;
      }
    },
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