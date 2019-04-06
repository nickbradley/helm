import {ChildProcess, spawn} from "child_process";
import * as desktop from "desktop-native";

export class Platform {
    private static instance: Platform;
    public static appCache: desktop.Application[] = [];

    private constructor() {
    }

    public static getInstance(): Platform {
        if (Platform.instance) {
            return Platform.instance;
        } else {
            return new Platform();
        }
    }

    public static activateWindow(name: string): boolean {
        return desktop.activateWindow(name);
    }

    public static listWindows(): desktop.Window[] {
        return desktop.listWindows();
    }

    public static listApplications(): desktop.Application[] {
        Platform.appCache = desktop.listApplications();
        // console.log("appCache was set to ", Platform.appCache);
        return Platform.appCache;
    }

    public static spawn(command: string, args: string[] = []): ChildProcess {
        const subprocess = spawn(command, args, {
            detached: true,
            stdio: "ignore",
        });

        subprocess.unref();

        return subprocess;
    }
}
