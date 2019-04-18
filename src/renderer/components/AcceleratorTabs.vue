<template>
    <div class="accelerator-tabs">
        <ul>
            <li
                v-for="(tab, index) in tabs"
                v-bind:key="tab.component"
                :class='{"active-item": currentTabIndex === index}'
            >{{tab.name}}

            </li>
        </ul>

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
        currentTabIndex: 0
      }
    },
    computed: {
      componentInstance () {
        const name = this.tabs[this.currentTabIndex].component;
        return () => import(`./accelerators/${name}`)
      }
    },
      mounted () {
        this.$root.$on("navLeft", () => {
           if (this.currentTabIndex > 0) {
               this.currentTabIndex--;
           }
        });

        this.$root.$on("navRight", () => {
            if (this.currentTabIndex < this.tabs.length - 1) {
                this.currentTabIndex++;
            }
        })
      },
  };
</script>

<style scoped>
    ul {
        display: flex;
        padding: 0;
        margin-bottom: 0;
        list-style: none;
        border-bottom: 2px solid lightgrey;
    }

    li {
        color: grey;
        padding: 10px 15px;
    }

    .accel-icon {
        height: 32px;
    }

    .active-item {
        color: #EA5E3D;
        border-bottom: 3px solid #EA5E3D;
    }

</style>