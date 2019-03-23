import {Platform} from "../../Platform";

export class Application {
    public readonly name: string;
    public readonly path: string;
    public readonly icon: string;

    constructor(name: string, path: string, icon: string) {
        this.name = name;
        this.path = path;
        this.icon = icon;
    }

    public launch(): void {
        Platform.spawn(this.path);
    }

}
