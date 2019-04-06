<template>
    <li>
        <img v-bind:src="icon"/>
        <a href="#" tabindex="0" v-on:click="open">{{label}}</a>
    </li>
</template>

<script>
  export default {
    name: "IconListItem",
    props: {
      icon: String,
      label: String,
      open: Function
    }
  };
</script>

<style scoped>
  li {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    padding-top: 4px;
  }

  li img {
    width: 24px;
    padding-right: 8px;
    vertical-align: middle;
  }

  li a {
    color: inherit;
    text-decoration: inherit;
  }
</style>