<template>
    <input
            type="text"
            class="input"
            :value="value"
            v-on="listeners"
    >
</template>

<script>
  export default {
    props: {
      value: {
        type: String,
        default: '',
      }
    },
    computed: {
      listeners () {
        return {
          // Pass all component listeners directly to input
          ...this.$listeners,
          // Override input listener to work with v-model
          input: event => this.$emit('input', event.target.value)
        }
      }
    }
  };
</script>

<style scoped>
    input {
        /*height: 3em;*/
        font-size: 1.5em;
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
    }
</style>