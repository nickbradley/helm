<template>
    <div class="accelerator-tabs">
        <button
                v-for="tab in tabs"
                v-bind:key="tab.component"
                v-bind:class="['tab-button', { active: currentTab === tab }]"
                v-on:click="currentTab = tab"
        >{{ tab.component  }}</button>

        <keep-alive>
            <component
                    v-bind:is="componentInstance"
                    v-bind:searchText="searchText"
                    class="tab"
            ></component>
        </keep-alive>
    </div>
</template>

<script>
  // NOTE: this uses dynamic imports https://itnext.io/vue-a-pattern-for-idiomatic-performant-component-registration-you-might-not-know-about-9f3c091846f5#539c
  export default {
    name: "AcceleratorTabs",

    props: {
      tabs: Array,
      searchText: String,
    },
    data: function () {
      return {
        currentTab: this.tabs[0]
      }
    },
    computed: {
      componentInstance () {
        const name = this.currentTab.component;
        return () => import(`./${name}`)
      }

    },
  };
</script>

<style scoped>

</style>