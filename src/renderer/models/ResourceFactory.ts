import {IdeaResource} from "./IdeaResource";
import {Resource} from "./Resource";

export class ResourceFactory {
    public static createResource(record: any): Resource {
        switch (record.trackerName) {
            case "aw-watcher-idea":
                console.log("Creating IdeaResource");
                return new IdeaResource(record);
            default:
                console.log("Creating Resource");
                return new Resource(record);
        }
    }
}