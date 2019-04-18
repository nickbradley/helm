<template>
    <div class="selectable-icon-list">
        <ul>
            <li
                v-for="(item, index) in items"
                v-bind:key="item.id"
                :class='[{"active-item": currentItemIndex === index}, {"animated": animated && currentItemIndex === index}]'
                @animationend="animated = false"
            >
                <img v-bind:src="item.icon"/>
                <div>
                    <p class="main-text">{{ item.text.main }}</p>
                    <p class="meta-text">{{ item.text.meta }}</p>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        name: "SelectableIconList",
        props: {
            items: Array,
        },
        data () {
            return {
                animated: false,
                currentItemIndex: 0,
            };
        },
        activated () {
            // TODO Registering and unregistering the event listeners in activated and deactivated is kind of a hack since
            // it assumes that this is embedded in a keep-alive component...
            this.$root.$on("navUp", () => {
                if (this.currentItemIndex > 0) {
                    this.currentItemIndex--;
                } else {
                    this.animated = true;
                }
            });

            this.$root.$on("navDown", () => {
               if (this.currentItemIndex < this.items.length - 1) {
                   this.currentItemIndex++;
               } else {
                   this.animated = true;
               }
            });

            this.$root.$on("enter", () => {
                this.activeItemTriggered();
            });

            // Fire on load
            this.activeItemChanged();
        },
        deactivated () {
            this.$root.$off("navUp");
            this.$root.$off("navDown");
            this.$root.$off("enter");
        },
        methods: {
            activeItemChanged () {
                const activeItem = this.items[this.currentItemIndex];
                this.scrollToActive();
                this.$emit("active", activeItem);
            },
            activeItemTriggered () {
                const activeItem = this.items[this.currentItemIndex];
                this.$emit("triggered", activeItem);
            },
            scrollToActive () {
                const el = this.$el.getElementsByClassName("active-item")[0];
                if (el) {
                    el.scrollIntoViewIfNeeded();
                }
            }
        },
        watch: {
            currentItemIndex: function () {
                this.activeItemChanged();
            }
        }
    }
</script>

<style scoped>
    ul {
        padding: 0;
        margin: 0;
    }
    .active-item {
        background-color: #EA5E3D;
        color: white;
    }
    .active-item .meta-text {
        display: initial;
    }
    .selectable-icon-list {
        overflow: hidden;
        overflow-y: auto;
    }

    li {
        min-height: 48px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        padding: 8px;
        display: flex;
        align-items: center;
    }

    li img {
        width: 48px;
        padding-right: 8px;
    }

    li div {
        display: inline-block;
    }

    .main-text{
        font-size: 1.3em;
        display: block;
        margin: 0;
    }
    .meta-text{
        font-size: 0.8em;
        margin: 0;
        display: none;
    }



    li.active-item.animated:first-child {
        animation: top-scroll-stop 100ms;
    }

    li.active-item.animated:last-child{
        animation: bottom-scroll-stop 100ms;
    }

    @keyframes top-scroll-stop {
        70% {
            transform: translateY(-10px);
        }
        85% {
            transform: translateY(0);
        }
        90% {
            transform: translateY(5px);
        }
        93% {
            transform: translateY(-2px);
        }
    }

    @keyframes bottom-scroll-stop {
        70% {
            transform: translateY(10px);
        }
        85% {
            transform: translateY(0);
        }
        90% {
            transform: translateY(-5px);
        }
        93% {
            transform: translateY(2px);
        }
    }
</style>