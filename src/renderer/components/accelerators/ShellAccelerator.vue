<template>
    <div class="wrapper">
        <SelectableIconList
                v-bind:items="shellSessions"
                @active="onActive"
                @triggered="onTrigger"
        >
        </SelectableIconList>
        <div class="preview">
            <h3>Commands in session:</h3>
            <ul class="command-list">
                <li v-for="(command, index) in currentSession.commands">
                    <input type="checkbox" v-bind:checked="command.isSelected" @click="onCommandClick(index, $event)">
                    <span :class='{"failed-command": command.code !== 0}'>{{command.cmd}}</span>
                </li>
            </ul>
            <code class="shell" v-html="shellCmd">{{shellCmd}}</code>
        </div>
    </div>
</template>

<script>

    import SelectableIconList from "../SelectableIconList";

    // const icon = "data:image/png;base64,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vPMyderULF68OLt27cqqVasyZcqUdHR02EHAGXEjIAHAGapWq/nPf/6TrVu35sorr8z111+fn/zkJ/nd735Xt3fjpVIpo0aNyuzZs/PHP/4x69evzwc/+MF0dXXZQQB15hTACPWPf/wjn/70p5Mkt912W97xjndk5syZmTBhQt0ew+TJk7Ny5cokybJly7J9+/b84he/yMGDB+0gAAFArR37MqCrr74673rXuzJz5sxce+21dX0MCxcuTPLKxYtPPvlk1q5dmy1bttg5AAJg6Bvu56Y2b96czZs3Z/Xq1enq6so111yTz3zmM3V9DDNmzMiMGTMyZ86cPP7449mwYUPuueceBxeAADD519r+/fuzdu3arFu3Lvfff38uuuiiLF26tK73Fejs7ExnZ2euu+66jB49OsuWLXOQAQwgFwFyUpVKJdu3b8/atWvz7ne/O+9973uzadOm9PT01O3CwdbW1lxwwQV2BoAAYDAcPnw4f/7zn3PjjTdm2rRpWbJkSZ544om6XLBXqVTsAAABwFDwrW99Kx/4wAeyYMGCrFmzJk888UTNtuVzv8Cx1wKvBwPHNQCclXXr1mXdunWZNGlSbrnllkybNi1z5swZ0G2Uy2UDDSAAGIqef/753HXXXSmXy3nyySezePFigwIwhDX0KYB63m/estQr+vv78+Mf/9hAADV5na3na22jf2eJawAYUKNHj3bVPsAw4BQAA2LKlCk5//zzs2rVqowfP96AAAgAGlVTU1OuueaavO1tb8uXv/zljBs3zqAACAAa1QUXXJDZs2fn7W9/ez7xiU/UfHuNfh4OQAAMYyPhIsBrr702H/nIR3L55Zfn8ssvr9t2jx496gADEADU2+c+97nMnDkzl112WTo6Ouq+/SNHjtgJAAJg6K4ANMoqQEtLS8aNG5e77747l156ad7ylrfU/WY8lUole/bsyfz587Nnzx4HGOBOgAKAWiiXy+ns7Mz06dPzzW9+M+eff35aW1vr+hj6+vrywgsvZOvWrfnKV76Snp6e9PX12TkAAoCB1tHRkWnTpmXmzJn5whe+MCiP4fnnn8/f/va3/OxnP8v3v/99OwVAAFArV111VaZNm5Ybb7wxM2bMGJTHsH79+jz33HNZvXp1tmzZYqcACABq5dZbb80ll1ySj370o5kwYcKgPIYVK1bkmWeeyb333muJHzht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";
    const icon = "data:image/png;base64,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";
    export default {
        name: "ShellAccelerator",
        components: {SelectableIconList},
        props: {
            searchText: String,
        },
        data() {
            return {
                shellSessions: [],
                currentSession: {},
            }
        },
        created() {
            this.$options.shellSessions = [
                // maybe the icon could be a count of the number of commands in the session? (i.e. a badge icon)
                {
                    id: 1,
                    text: {main: "24 minutes ago", meta: "1 command over 24 minutes"},
                    icon: icon,
                    commands: [{
                        cwd: "/home/ncbradley/do/electron-webpack-quick-start",
                        cmd: "yarn dev",
                        duration: 1440,
                        isSelected: false
                    }]
                },
                {
                    id: 2,
                    text: {main: "2 hours ago", meta: "5 commands over 4 minutes"},
                    icon: icon,
                    commands: [
                        {
                            cwd: "/home/ncbradley/do/electron-webpack-quick-start",
                            cmd: "git status",
                            duration: 0,
                            code: 0,
                            isSelected: false
                        },
                        {
                            cwd: "/home/ncbradley/do/electron-webpack-quick-start",
                            cmd: "git add --all",
                            duration: 0,
                            code: 0,
                            isSelected: false
                        },
                        {
                            cwd: "/home/ncbradley/do/electron-webpack-quick-start",
                            cmd: "git checkout -b 'ui'",
                            duration: 0,
                            code: 0,
                            isSelected: false
                        },
                        {
                            cwd: "/home/ncbradley/do/electron-webpack-quick-start",
                            cmd: "git commit -m 'Everything is working now!'",
                            duration: 0,
                            code: 0,
                            isSelected: false
                        },
                        {
                            cwd: "/home/ncbradley/do/electron-webpack-quick-start",
                            cmd: "git push",
                            duration: 0,
                            code: 1,
                            isSelected: false
                        },
                        {
                            cwd: "/home/ncbradley/do/electron-webpack-quick-start",
                            cmd: "git push --set-upstream origin ui",
                            duration: 2,
                            code: 0,
                            isSelected: false
                        }
                    ]
                }
            ];
        },
        mounted () {
            this.shellSessions = this.$options.shellSessions;
        },
        methods: {
            onActive (session) {
                console.log("ShellAccelerator::onActive() - ", session);
                this.currentSession = session;
            },
            onTrigger(session) {

            },
            onCommandClick (commandsIndex, event) {
                console.log("ShellAccelerator::onCommandClick() - ", commandsIndex, event.target.checked);
                this.currentSession.commands[commandsIndex]["isSelected"] = event.target.checked;
            }
        },
        computed: {
            shellCmd () {
                let shellCmd = "";
                if (this.currentSession.commands){
                    const selectedCommands = this.currentSession.commands.filter((command) => command.isSelected);
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

        display: flex;
        flex-direction: column;
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
    /*[badge]:after {*/
        /*background: red;*/
        /*border-radius: 30px;*/
        /*color: #fff;*/
        /*content: attr(badge);*/
        /*font-size: 11px;*/
        /*margin-top: -10px;*/
        /*min-width: 20px;*/
        /*padding: 2px;*/
        /*position: absolute;*/
        /*text-align: center;*/
    /*}*/

    /*[badge^="-"]:after,*/
    /*[badge="0"]:after,*/
    /*[badge=""]:after {*/
        /*display: none;*/
    /*}*/
</style>