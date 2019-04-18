<template>
    <div class="wrapper">
        <SelectableIconList
            v-bind:items="files"
            @active="onActive"
            @triggered="onTrigger"
        >
        </SelectableIconList>
        <div id="preview-pane" class="preview" v-html="previewPane"> {{ previewPane }}
        </div>
    </div>
</template>

<script>
    import SelectableIconList from "../SelectableIconList";
    import hljs from 'highlight.js';
    import * as fs from "fs";
    import * as path from "path";
    import { shell } from "electron";

    // TODO make this configurable?
    import 'highlight.js/styles/idea.css';

    // https://stackoverflow.com/a/20732091
    function humanFileSize(size) {
        const i = size === 0 ? 0 : Math.floor( Math.log(size) / Math.log(1024) );
        return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    }

    const defaultIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHnSURBVHhe7dK9ShxhGIbhPWTPwEMwTVqLQKp0OQcbCUhIJaSxsUkdUGNcd+L6s2bHX4R17uuBu5riY16umZmZmZmZmZnZa7azf/L5w/7pvNHJ9vK37XotAEMQrKwHYAiCmzUBDEHwb1MH8PXn+fzjt/XfIFhs6gD2js/nB7/+QjC2AoCj3xcQjK0CAIKRlQBAsGY1ABDcWxEABHdWBTAEwWJlAEN5BHUAQ2kEAFyVRQDAbUkEAKyWQwDA/6UQALC+DAIAxksgAODhJo8AgMebNAIAntZkEQDw9CaJAIDnNTkEADy/SSEA4GU9hGBx063leTd/ALy8MQTDTZfn3fwB8LrWIQBgg/r042z+5fDPm7b7/WzlTQDiARAPgHgAxAMgHgDxAIgHQDwA4gEQD4B4AMQDIB4A8QCIB0A8AOIBEA+AeADEAyAeAPEAiAdAPADiARAPgHgAxAMgHgDxAIgHQDwA4gEQD4B4AMQDIB4A8QCIB0A8AOIBEA+AeADEAyAeAPEAiAdAPADiARAPgHgAxAMgHgDxAIgHQDwA4gEQD4B4AMQDIB4A8QCIB0A8AOIBEA+AeADEAyAeAPEAiAdAPADiARAPgHgAxAMgHgDxAIgHQDwA4gEQ710BMDMzMzMzM7MN3Gx2Cb0ns/Dvyu+lAAAAAElFTkSuQmCC";

    export default {
        name: "Accelerator",
        components: {SelectableIconList},
        props: {
            searchText: String
        },
        data () {
            return {
                previewPane: "",
            };
        },
        methods: {
            onActive (file) {
                console.log("FileAccelerator::onActive() - ", file);
                const ext = path.extname(file.path).substr(1);
                if (hljs.getLanguage(ext)) {
                    // We do the async to void blocking the UI; loading the preview is low priority.
                    fs.readFile(file.path, "utf8", (err, data) => {
                        let displayHtml;
                        try {
                            const output = hljs.highlight(ext, data);
                            displayHtml = `<pre><code>${output.value}</code></pre>`;
                        } catch (err) {
                            displayHtml = "Failed to load preview";
                        }
                        this.previewPane = displayHtml;
                    });
                } else {
                    fs.stat(file.path, (err, stats) => {
                        let displayHtml;
                       if (err) {
                           displayHtml = "<div>Error reading file.</div>";
                       } else {
                           displayHtml = `<div>
                                <img src="${file.icon}"/>
                                <p class="icon-caption">${file.text.main}</p>
                                <dl>
                                    <dt>Last opened:</dt><dd>${new Date(stats.atime).toLocaleString()}</dd>
                                    <dt>Modified:</dt><dd>${new Date(stats.mtime).toLocaleString()}</dd>
                                    <dt>Created:</dt><dd>${new Date(stats.birthtime).toLocaleString()}</dd>
                                    <dt>Size:</dt><dd>${humanFileSize(stats.size)}</dd>
                                </dl>
                            </div>`
                       }
                       this.previewPane = displayHtml;
                    });

                }
            },
            onTrigger (file) {
                console.log("FileAccelerator::onTrigger() - ", file);
                shell.showItemInFolder(file.path);
            }
        },
        computed: {
            files: function () {
                console.log(this.searchText);
                return this.$options.fileList.filter((file) => file.text.main.indexOf(this.searchText) >= 0)
            }
        },
        watch: {
            // searchText() {console.log(this.searchText);}
        },
        created() {
            this.$options.displayName = "Files";
            this.$options.fileList = [
                {
                    id: 1,
                    path: path.join(__static, "mock/package.json"),
                    text: {
                        main: "package.json",
                        meta: path.join(__static, "mock/package.json"),
                    },
                    icon: defaultIcon,
                },
                {
                    id: 2,
                    path: path.join(__static, "mock/index.js"),
                    text: {
                        main: "index.js",
                        meta: path.join(__static, "mock/index.js"),
                    },
                    icon: defaultIcon,
                },
                {
                    id: 3,
                    path: path.join(__static, "mock/File.ts"),
                    text: {
                        main: "File.ts",
                        meta: path.join(__static, "mock/File.ts"),
                    },
                    icon: defaultIcon,
                },
                {
                    id: 4,
                    path: "/I/don't/exist",
                    text: {
                        main: "non-existent",
                        meta: "/I/don't/exist",
                    },
                    icon: defaultIcon
                },
                {
                    id: 5,
                    path: path.join(__static, "mock/.gitignore"),
                    text: {
                        main: ".gitignore",
                        meta: path.join(__static, "mock/.gitignore")
                    },
                    icon: defaultIcon,
                },
                {
                    id: 6,
                    path: path.join(__static, "mock/firefox.png"),
                    text: {
                        main: "firefox.png",
                        meta: path.join(__static, "mock/firefox.png"),
                    },
                    icon: defaultIcon
                },
                {
                    id: 7,
                    path: path.join(__static, "mock/intellij.png"),
                    text: {
                        main: "intellij.png",
                        meta: path.join(__static, "mock/intellij.png"),
                    },
                    icon: defaultIcon
                }
            ];
        }
    }
</script>

<style scoped>
    .wrapper {
        display: flex;
        height: 100%;
        overflow: hidden;
    }
    .wrapper >>> .selectable-icon-list {
        flex: 0 0 40%;

    }
    .preview {
        flex: 1;
        overflow: auto;
        margin-right: 10px;
    }
    .preview >>> pre {
        margin: 0;
    }
    .preview >>> div {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        flex-direction: column;
        color: gray;
    }
    .preview >>> div > img {
        height: 128px;
    }
    .preview >>> .icon-caption {
        color: initial;
        font-size: larger;
    }
    .preview >>> div dl {
        display: grid;
        grid-template-columns: max-content auto;
    }
    .preview >>> div dt {
        grid-column-start: 1;
        justify-self: end;
    }
    .preview >>> div dd {
        grid-column-start: 2;
        margin-left: 10px;
    }
</style>