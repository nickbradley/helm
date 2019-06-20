<template>
  <div>
    <h3>Commands in session:</h3>
    <ul class="command-list">
      <li v-for="(command, index) in file.commands">
        <input type="checkbox" v-bind:checked="command.isSelected" @click="onCommandClick(index, $event)">
        <span :class='{"failed-command": command.code !== 0}'>{{command.cmd}}</span>
      </li>
    </ul>
    <code class="shell" v-html="shellCmd">{{shellCmd}}</code>
  </div>
</template>

<script>
  export default {
    name: "ShellPreview",
    props: {
      file: Object
    },
    data() {
      return {
        shellSessions: [],
        currentSession: {}
      };
    },
    methods: {
      onCommandClick(commandsIndex, event) {
        console.log("ShellAccelerator::onCommandClick() - ", commandsIndex, event.target.checked);
        this.file.commands[commandsIndex]["isSelected"] = event.target.checked;
      }
    },
    computed: {
      shellCmd() {
        let shellCmd = "";
        if (this.file.commands) {
          const selectedCommands = this.file.commands.filter((command) => command.isSelected);
          if (selectedCommands.length > 0) {
            shellCmd = `<span>cd ${selectedCommands[0].cwd}</span><span class="and"> && </span>` + selectedCommands.map((command) => `<span>${command.cmd}</span>`).join(`<span class="and"> && </span>`);
          }
        }

        return shellCmd;
      }
    }
  };
</script>

<style scoped>
  .shell {
    background: #000;
    color: ghostwhite;
    max-height: 30%;
    min-height: 10em;
  }

  .command-list {
    flex: 1;
    list-style: none;
  }

  .shell {
    padding: 8px;
  }

  .shell::before {
    content: "> ";
  }

  .failed-command {
    color: red;
  }

  .shell >>> .and {
    color: grey;
  }
</style>