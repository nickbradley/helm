<template>
  <div v-html="previewPane">{{ previewPane }}</div>
</template>

<script>
  import hljs from "highlight.js";
  import * as path from "path";
  import * as fs from "fs";
  // TODO make highlightjs configurable by the user?
  import "highlight.js/styles/idea.css";



  export default {
    name: "FilePreview",
    props: {
      item: Object
    },
    computed: {
      file() {
        // alias the item prop
        return this.item;
      }
    },
    asyncComputed: {
      async previewPaneFile() {
        console.log("FileAccelerator::onActive() - ", this.file);

        // https://stackoverflow.com/a/20732091
        function humanFileSize(size) {
          const i = size === 0 ? 0 : Math.floor( Math.log(size) / Math.log(1024) );
          return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
        }


        if (!this.file || !this.file.path) return;

        const ext = path.extname(this.file.path).substr(1);
        console.log("Extenstion is", ext);
        if (hljs.getLanguage(ext)) {
          // We do the async to void blocking the UI; loading the preview is low priority.
          fs.readFile(this.file.path, "utf8", (err, data) => {
            console.log("ERROR: ", err, "Data: ", data);
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
          fs.stat(this.file.path, (err, stats) => {
            let displayHtml;
            if (err) {
              displayHtml = `<div class="centered">Error reading file.</div>`;
            } else {
              displayHtml = `<div class="centered">
                                <img src="${this.file.icon}"/>
                                <p class="icon-caption">${this.file.text.main}</p>
                                <dl>
                                    <dt>Last opened:</dt><dd>${new Date(stats.atime).toLocaleString()}</dd>
                                    <dt>Modified:</dt><dd>${new Date(stats.mtime).toLocaleString()}</dd>
                                    <dt>Created:</dt><dd>${new Date(stats.birthtime).toLocaleString()}</dd>
                                    <dt>Size:</dt><dd>${humanFileSize(stats.size)}</dd>
                                </dl>
                            </div>`;
            }
            this.previewPane = displayHtml;
          });

        }
      }
    },
    data: () => ({
      previewPane: "<p>Default File Preview</p>"
    })
  };
</script>

<style scoped>

  div >>> pre {
    margin: 0 0 0 10px;
  }

  div >>> img {
    height: 128px;
  }

  div >>> .icon-caption {
    color: initial;
    font-size: larger;
  }

  div >>> dl {
    display: grid;
    grid-template-columns: max-content auto;
  }

  div >>> dt {
    grid-column-start: 1;
    justify-self: end;
  }

  div >>> dd {
    grid-column-start: 2;
    margin-left: 10px;
  }
</style>