import {EventEmitter} from "events";

export class SearchInput extends EventEmitter {
    public readonly element: HTMLInputElement;

    constructor(element: HTMLInputElement) {
        super();
        this.element = element;
        this.element.oninput = (ev: Event) => {
            this.emit("change", this.element.value);
        }
    }
}