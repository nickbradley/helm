import * as http from "http";
import {Resource} from "./Resource";

export class IdeaResource extends Resource {
    private static port: number = 63342;

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
        super(
            // firstUse,
            // lastUse,
            // duration,
            // trackerName,
            // appName,
            // appTitle,
            // reference,
            // project,
            record,
        );

    }
    public open(): Promise<boolean> {
        console.log("Opening with IDEA", this);
        return new Promise<boolean>((resolve, reject) => {
            const url = `http://localhost:${IdeaResource.port}/api/file?file=${this.reference}`;
            console.log("URL", url);
            http.get(url, (res) => {
                console.log(res.statusCode, res.statusMessage);
                resolve(true);
            });
        });
    }
}
