<template>
  <div>
    <dl v-on:keydown="onKeydown" @keydown.enter="onTrigger">
      <template v-for="(groupItems, group) in groupedItems">
        <dt>{{ group }}</dt>
        <dd>
          <ul>
            <li v-for="(item) in groupItems" tabindex="-1" @click="onClick" @dblclick="onTrigger">
              <p>
                <img v-bind:src=item.icon>{{ item.title }}
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
    updated() {
      // Set the first item in the list to be active
      const listElement = this.$el.getElementsByTagName("li")[0];

      if (!listElement) {
        return;
      }

      listElement.tabIndex = 0;
      listElement.classList.add("active");

      this.activeItemIndex = 0;
    },
    watch: {
      activeItemIndex() {
        this.$emit("active", this.items[this.activeItemIndex]);
      }
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

        let nextListElement;
        switch (event.key) {
          case "ArrowDown":
            nextListElement = listElements[this.activeItemIndex + 1];
            break;
          case "ArrowUp":
            nextListElement = listElements[this.activeItemIndex - 1];
            break;
        }

        this.setActive(nextListElement);
      },
      onClick(event) {
        let nextElement = event.target;
        let depth = 0;
        while (nextElement.tagName !== "LI" && depth < 5) {
          nextElement = nextElement.parentElement;
          depth++;
        }
        this.setActive(nextElement);
      },
      onTrigger() {
        const triggeredItem = this.items[this.activeItemIndex];
        this.$emit("trigger", triggeredItem);
      },
      setActive(listElement) {
        if (!listElement) {
          console.warn("Invalid list element", listElement);
          return;
        }

        const listElements = this.$el.getElementsByTagName("li");
        const currActiveElement = listElements[this.activeItemIndex];
        const nextActiveElement = listElement;

        if (nextActiveElement === currActiveElement) {
          console.warn("Activating same element.");
          return;
        }

        nextActiveElement.classList.toggle("active");
        currActiveElement.classList.toggle("active");
        nextActiveElement.focus();
        nextActiveElement.tabIndex = 0;
        currActiveElement.tabIndex = -1;

        let newItemId = -1;
        for (const el of listElements) {
          newItemId++;
          if (el.tabIndex === 0) {
            break;
          }
        }

        this.activeItemIndex = newItemId;
      }
    }
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
    padding: 8px 0 8px 14px;
    text-transform: uppercase;
    font-size: 0.8em;
  }

  dt::after {
    content: "s";
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

  p {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 15px;
  }

  li {
    display: inline-block;
    width: 100%;
    text-decoration: none;
    color: inherit;
    padding-left: 14px;
    font-size: 0.8em;
    user-select: none;
    vertical-align: middle;
  }

  li.active {
    background: #0a84ff66;
    color: white;
    outline: none;
  }

  li:focus {
    background: #0a84ff;
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