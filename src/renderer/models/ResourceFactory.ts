import {IdeaResource} from "./IdeaResource";
import {Resource} from "./Resource";
import {WebResource} from "./WebResource";

export class ResourceFactory {
    public static createResource(record: any): Resource {
        if (record.trackerName === "aw-watcher-idea") {
            return new IdeaResource(record);
        }

        if (record.trackerType === "web.tab.current") {
            return new WebResource(record);
        }

        return new Resource(record);
    }
}