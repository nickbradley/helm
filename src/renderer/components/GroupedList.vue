<template>
  <div>
    <dl v-on:keydown="onKeydown" @keydown.enter="onTrigger">
      <template v-for="(groupItems, group) in groupedItems">
        <dt>{{ group }}</dt>
        <dd>
          <ul>
            <li v-for="(item) in groupItems" tabindex="-1" @click="onClick" @dblclick="onTrigger">
              <p>
                <img v-bind:src=item.icon>{{ item.text }}
              </p>
            </li>
          </ul>
        </dd>
      </template>
    </dl>
  </div>
</template>

<script>
  export default {
    name: "GroupedList",
    props: {
      items: Array
    },
    data() {
      return {
        activeItemIndex: 0
      };
    },
    mounted() {
      this.$el.getElementsByTagName("li")[0].tabIndex = 0;
    },
    computed: {
      groupedItems() {
        return this.items.reduce((obj, item) => {
          const group = item.group;
          if (!obj.hasOwnProperty(group)) {
            obj[group] = [];
          }

          // Push the number to its integer key
          obj[group].push(item);

          // Pass the object on to the next loop
          return obj;
        }, {});
      }
    },
    methods: {
      onKeydown(event) {
        const listElements = this.$el.getElementsByTagName("li");
        const currListElementIndex = this.activeItemIndex;

        let nextListElementIndex = -1;
        if (event.key === "ArrowDown") {
          nextListElementIndex = currListElementIndex + 1;
        } else if (event.key === "ArrowUp") {
          nextListElementIndex = currListElementIndex - 1;
        }

        if (nextListElementIndex >= 0 && nextListElementIndex < listElements.length) {
          listElements[nextListElementIndex].focus();
          listElements[nextListElementIndex].tabIndex = 0;
          listElements[currListElementIndex].tabIndex = -1;

          this.activeItemIndex = nextListElementIndex;
          this.$emit("active", this.items[nextListElementIndex]);
        }
      },
      onClick(event) {
        let nextElement = event.target;
        let depth = 0;
        while (nextElement.tagName !== "LI" && depth < 5) {
          nextElement = nextElement.parentElement;
          depth++;
        }

        if (nextElement.tabIndex === 0) {  // clicked on the focused item; do nothing
          return;
        }

        const listElements = this.$el.getElementsByTagName("li");
        const currListElementIndex = this.activeItemIndex;
        let nextListElementIndex = -1;
        for (const [idx, item] of Object.entries(listElements)) {
          if (item === nextElement) {
            nextListElementIndex = Number(idx);
            break;
          }
        }

        nextElement.focus();
        nextElement.tabIndex = 0;
        listElements[currListElementIndex].tabIndex = -1;

        this.activeItemIndex = nextListElementIndex;
        this.$emit("active", this.items[nextListElementIndex]);
      },
      onTrigger() {
        const triggeredItem = this.items[this.activeItemIndex];
        this.$emit("trigger", triggeredItem);
      }
    },
  };
</script>

<style scoped>
  dl {
    margin: 0;
  }

  dt {
    display: inline-block;
    background: #e5e5ea;
    width: 100%;
    padding: 8px 0 8px 30px;
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    padding: 0;
  }

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  li {
  }

  li {
    display: inline-block;
    width: 100%;
    text-decoration: none;
    color: inherit;
    padding-left: 30px;

  }

  li:focus {
    background: #0a84ff;
    color: white;
    outline: none;
  }

  img {
    width: 1.5em;
    padding-right: 8px;
    vertical-align: middle;
  }

  li a div {
    display: inline-block;
  }
</style>