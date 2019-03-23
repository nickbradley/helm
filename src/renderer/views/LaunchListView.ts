import {LaunchView} from "./LaunchView";
import {LaunchPresenter} from "../presenters/LaunchPresenter";
import {SearchInput} from "../SearchInput";

export interface LaunchItem {
    displayOrder: number;
    text: string;
    icon: string;
}

export class LaunchListView implements LaunchView {
    public static inputElementId: string = "txt-input";
    public static listElementId: string = "launch-items";

    private readonly htmlContainer: HTMLBodyElement;
    public readonly presenter: LaunchPresenter;
    public readonly input: HTMLInputElement;
    private _activeElement: HTMLAnchorElement;

    constructor(container: HTMLBodyElement) {
        this.htmlContainer = container;
        this.input = document.getElementById("input-view").getElementsByTagName("input")[0] as HTMLInputElement;
        this.input.oninput = () => this.presenter.onInputChanged();

        this.presenter = new LaunchPresenter(this);
        this.registerKeydownListener();
        this.registerVisibilityListener();
        // tell the presenter we are visible since the visibilityListener won't pick up the initial load
        this.presenter.onVisible();
    }

    public get activeElement(): HTMLAnchorElement {
        return this._activeElement;
    }

    public set activeElement(element: HTMLAnchorElement) {
        this._activeElement = element;
        this._activeElement.focus();
    }

    public bind(items: LaunchItem[]): void {
        const listId = LaunchListView.listElementId;
        const oldList = document.getElementById(listId);
        const frag = new DocumentFragment();
        const newList = LaunchListView.createListContainer(listId);
        for (const item of items) {
            const listElement = this.createListElement(item);
            newList.appendChild(listElement);
        }
        frag.appendChild(newList);

        if (oldList) {
            this.htmlContainer.replaceChild(frag, oldList);
        } else {
            this.htmlContainer.appendChild(frag);
        }

        const firstListItem = document.getElementById(listId).firstChild;
        if (firstListItem) {
            // set the (anchor tag of the) first result as active
            this.activeElement = firstListItem.children[1] as HTMLAnchorElement;
        }
    }

    public focusInput(): void {
        this.input.focus();
    }

    public focusPrevious(): void {
        const prevElement = this.activeElement.parentNode.previousSibling; //.parentNode
        if (prevElement) {
            this.activeElement = prevElement.children[1] as HTMLAnchorElement; // .firstChild as HTMLAnchorElement;
        }
    }

    public focusNext(): void {
        const nextElement = this.activeElement.parentNode.nextSibling; // .parentNode
        if (nextElement) {
            this.activeElement = nextElement.children[1] as HTMLAnchorElement;//.firstChild as HTMLAnchorElement;
        }
    }

    public clearInput(): void {
        this.input.value = "";
        console.log("JUST CLEARED");
    }

    public clearItems(): void {
        const list = document.getElementById(LaunchListView.listElementId);
        this.htmlContainer.removeChild(list);
        console.log("LIST CLEARED");
    }

    private registerKeydownListener(): void {
        window.onkeydown = this.keydownNotifier.bind(this);
    }

    private keydownNotifier(ev: KeyboardEvent): void {
        switch(ev.key) {
            case "ArrowUp":
                console.log("Arrow up");
                this.presenter.onArrowUp();
                break;
            case "ArrowDown":
                console.log("Arrow down");
                this.presenter.onArrowDown();
                break;
            case "Enter":
                break;
            default:
                this.presenter.onOtherKey();
                break;
        }
    }

    private registerVisibilityListener(): void {
        document.onvisibilitychange = () => {
            switch (document.visibilityState) {
                case "hidden":
                    this.presenter.onHidden();
                    break;
                case "visible":
                    this.presenter.onVisible();
                    break;
            }
        }
    }

    private createInputElement(id: string): HTMLInputElement {
        // <input id="txt-search" type="text" placeholder="Search..." autofocus>
        const input = document.createElement("input");
        input.id = id;
        input.type = "text";
        input.placeholder = "Type to search...";
        input.oninput = () => this.presenter.onInputChanged();
        return input;
    }

    private static createListContainer(id: string): HTMLOListElement {
        const ol = document.createElement("ol");
        ol.id = id;
        return ol;
    }

    private createListElement(item: LaunchItem): HTMLLIElement {
        // need to create anchor tag so we have something to focus
        const a = document.createElement("a");
        a.href = "#";
        a.tabIndex = 0;
        a.innerText = item.text;
        a.onclick = (e: MouseEvent) => {
            e.preventDefault();
            this.presenter.onLaunchItemSelected(item);
        };

        const img = document.createElement("img");
        img.src = item.icon;

        const li = document.createElement("li");
        li.appendChild(img);
        li.appendChild(a);
        return li;
    }
}