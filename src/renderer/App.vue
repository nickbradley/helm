<template>
  <div>
    <div class="inner-addon">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfjBhQDOTgo/32ZAAAEB0lEQVRo3sXZWYiWZRjG8d+M4zYuA4qVg5bivjQVmqmVS1ISIQQWJS1QSlGdCGYKRdpCaMuBeVhHIYG2IEGiYRkuCCkpiOYSVjYOpumMjs7qfHcHfgxizre/zPUdfbzX/Vz/592f+y2Tm3qZbpaJxhqqnyqNrvjHcb/ZY7emHEcpSD0t8JUrostfqy0W6VvY8GUZt1Za4nXD0/+aHXbcKQ2aVBqo2niTDEhvPW+d9RpKOfdF6tJz/Ntas/W+iafCDKucSPvqvapHacKH2pYedJfHlGfdj7NsSft/Mab4+HnOCOGoh/OommafEC55qrj457QJHd7XK8/Kcku1CCkrCo9/TUr4N6+5X6+p/hTCmsLKn9YhnHZn4TMw1AEhvJF/6UytQq0RRcTDIIeElCfyKxvslFBvcpHxMMwpocGofIo2CimPlyAe7tMm7Ml6CXfqESF8WqJ4WC6ExbmZyx0RajtvrKVQhYPCWf1zMT8phGdKGA8PCmFZLtb9wrFS3cev009CnZ7ZbHcJ4aWSxzNfCAuy2T4RmgxMAKBcrbApm+2osDGBePhYuKgik6U6n8slb107CNO73kXcD35OCGCX9s6MLgDG47KTCQE0+R3jMgGMxXGREADHsgEMwenE4q+NPSQTwAA0JgjQmM7oEqA3WhMEaEafTABNqEwQoD8uZwK4hKoEAapkOMTlqKPol7BMGinDSV7u2mUyKvsTq2CNS2d0CXAYPdUkFH+L4TiSCWCPdsxNCOAhZbLe6PcKOxIC+EKozWZaLqSMTCC+n0ZhXTZbtavCewkALBHCvdmNm4ULJX8nqnBC+DUX6zQhrC4xwGIhLMzN/L3QnN9SKosGOScczHVtNEaLsKOEr+YbhJQHci94WwjvlCj+2un3WT4l5bYLKc+XIH6OZuFYvku9arVCq0eLjJ+iQWgwKf/SSc4L7V4sIn6ui0JroU2eGS4IKR9kXkx0oTJLtQphb94trk5NVpvuEI7Ps3KY74TQIYSvC5oCuM32dBd4jcE51vS3UqMQDpjgWyFsyL0/cqN6WJluUF/ykQlZ3HdY5ZwQ2q3VB73SndPPs3SjM2qEb6TSDdh93jXnf8+KSjO9aWena5u7O7f19aMQ1hcOADW+1HJda77OXj/YZKs9/uoMDldtNuuG2n52C2FtcQgM8optXX4xaLPTMrfftLIq3T1e3fXguR+hXqaaaKxqA1Rqc1mtkw7Zn/F7ySA71GCFD4vdD4VqiMO5t6qS0a2OCikvdx/CcH8IHSVvA+ah0U4LV4v9lFGMxjkjtGVv2SWnGudL8rAvQveoF66Y3X0IMzUKF03rPoR5moV6U7oPYb4W4WwhL2yl0kLtwmmjuw/hWR3C1u4D4AUXvcV/0eWHchLp+AIAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTktMDYtMjBUMDE6NTc6NTYrMDI6MDBS1huwAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE5LTA2LTIwVDAxOjU3OjU2KzAyOjAwI4ujDAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAASUVORK5CYII="/>
      <input type="text" autofocus class="input" v-model="searchTerm" v-on:keyup.enter="onEnter"/>
    </div>
    <div class="wrapper">
      <GroupedList class="list-pane" v-on:active="onActive" v-on:trigger="onTrigger"
                   v-bind:items="searchResults"></GroupedList>
      <component class="preview-pane" v-bind:item="activeItem" v-bind:is="previewComponent"></component>
    </div>
  </div>
</template>

<script lang="ts">
  import GroupedList from "./components/GroupedList.vue";
  import FilePreview from "./components/previews/FilePreview.vue";
  import WindowPreview from "./components/previews/WindowPreview.vue";
  import UrlPreview from "./components/previews/UrlPreview.vue";
  import ShellPreview from "./components/previews/ShellPreview.vue";
  import {ipcRenderer} from "electron";

  export default {
    name: "App",
    components: {
      GroupedList,
      FilePreview,
      WindowPreview,
      UrlPreview,
      ShellPreview
    },
    props: {
      backgroundWindowId: Number
    },
    data: function () {
      return {
        searchTerm: "",
        searchResults: [],
        activeItem: {},
        partialSearch: null,
        inputTimer: null
      }
    },
    watch: {
      searchTerm: function () {
        const that: any = this;

        that.partialSearch = that.searchTerm;
        if (that.inputTimer) {
          clearTimeout(that.inputTimer);
        }

        that.inputTimer = setTimeout(() => {
          if (that.partialSearch === that.searchTerm) {
            //Search term has stabilized here
            ipcRenderer.sendTo(that.backgroundWindowId, "search", that.searchTerm);
          }
        }, 250);


      }
    },
    mounted() {
      // Get the initial list of results (TODO This doesn't work)
      ipcRenderer.sendTo((this as any).backgroundWindowId, "search", (this as any).searchTerm);
      ipcRenderer.on("search-results", (event: any, arg: any) => {
        (this as any).searchResults = arg;
      });
    },
    methods: {
      open: function(title: any) {
        console.log(`WindowAccelerator::open() - Opening window with title ${title}`);

      },
      onActive(item: any) {
        console.log("WindowAccelerator::onActive() - ", item);
        (this as any).activeItem = item;
      },
      onTrigger(window: any) {
        console.log("WindowAccelerator::onTrigger() - ", window);
      },
      onEnter() {
        // clear the input timer
        // make the search
        // focus the results (once they arrive)
      }
    },
    computed: {
      previewComponent: function() {
        let component;

        switch ((this as any).activeItem.group) {
          case "file":
            component = "FilePreview";
            break;
          case "window":
            component = "WindowPreview";
            break;
          case "website":
            component = "UrlPreview";
            break;
          case "shell session":
            component = "ShellPreview";
            break;
        }
        return component;
      }
    }
  };
</script>

<style>
  body {
    margin: 0;
    height: 100vh;
    overflow: hidden;
  }

  .inner-addon {
    position: relative;
  }

  .inner-addon img {
    position: absolute;
    padding: 14px;
    pointer-events: none;
    height: 24px;
  }

  .input {
    height: 60px;
    font-size: 1.6em;
    width: 100%;
    padding: 10px 10px 10px 54px;
    box-sizing: border-box;
  }

  .wrapper {
    display: flex;
    overflow: hidden;
    /* This is a total hack to fix the height of the accelerator window so that the max height is set and scrollbars
       will appear. https://stackoverflow.com/a/22934372
     */
    height: calc(100vh - 60px);
  }

  .list-pane {
    flex: 0 0 40%;
    overflow-x: hidden;
  }

  .preview-pane {
    flex: 1;
    overflow: auto;
    /*margin-left: 10px;*/
    display: flex;
    height: 100%;
    flex-direction: column;
  }

  .centered {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    flex-direction: column;
    color: gray;
  }


</style>
