import {Platform} from "../Platform";
// import {IdeaResource} from "./IdeaResource";

export class Resource {
    public readonly firstUse: Date;
    public readonly lastUse: Date;
    public readonly duration: number;
    public readonly trackerName: string;
    public readonly appName: string;
    public readonly appTitle: string;
    public readonly reference: string;
    public readonly project: string;

    constructor(
        // firstUse: Date,
        // lastUse: Date,
        // duration: number,
        // trackerName: string,
        // appName: string,
        // appTitle: string,
        // reference: string,
        // project: string,
        record: any,
    ) {
        this.firstUse = record.firstUse;
        this.lastUse = record.lastUse;
        this.duration = record.duration;
        this.trackerName = record.trackerName;
        this.appName = record.appName;
        this.appTitle = record.appTitle;
        this.reference = record.reference;
        this.project = record.project;
    }

    public async open(): Promise<boolean> {
        console.log("Opening resource ");
        const window = Platform.listWindows().filter((w) => w.title === this.appTitle)[0];
        if (window) {
            const windowId: string = window.identifier;
            return Platform.activateWindow(windowId);
        }
    }

    // public static resourceFromRecord(resourceRecord: any): Resource {
    //     // const firstUse = record.first_use;
    //     // const lastUse = record.last_use;
    //     // const duration = record.duration;
    //     // const trackerName = record.tracker_name;
    //     // const appName = record.app_name;
    //     // const appTitle = record.app_title;
    //     // const reference = record.reference;
    //     // const project = record.project;
    //
    //
    // }
}
