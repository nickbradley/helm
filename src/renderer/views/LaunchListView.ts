import {LaunchView} from "./LaunchView";
import {LaunchPresenter} from "../presenters/LaunchPresenter";

export interface LaunchItem {
    displayOrder: number;
    text: string;
    icon: string;
}

export class LaunchListView implements LaunchView {
    public static inputElementId: string = "input-view";
    public static listElementId: string = "launch-items";

    private readonly htmlContainer: HTMLDivElement;
    public readonly presenter: LaunchPresenter;
    public readonly input: HTMLInputElement;
    private activeElem: HTMLAnchorElement | null;

    constructor(container: HTMLDivElement) {
        this.htmlContainer = container;
        const searchView = this.createSearchView(LaunchListView.inputElementId);
        this.htmlContainer.appendChild(searchView);
        this.input = searchView.getElementsByTagName("input")[0];
        this.activeElem = null;
        this.presenter = new LaunchPresenter(this);
        this.registerKeydownListener();
        this.registerVisibilityListener();
        // tell the presenter we are visible since the visibilityListener won't pick up the initial load
        this.presenter.onVisible();
    }

    public get activeElement(): HTMLAnchorElement | null {
        return this.activeElem;
    }

    public set activeElement(element: HTMLAnchorElement | null) {
        this.activeElem = element;
        if (this.activeElem) {
            this.activeElem.focus();
        }
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

        // const firstListItem = document.getElementById(listId).firstChild;
        const listItem = document.getElementById(listId);
        if (listItem && listItem.firstChild) {
            // set the (anchor tag of the) first result as active
            this.activeElement = listItem.firstChild.childNodes[1] as HTMLAnchorElement;
        }
    }

    public focusInput(): void {
        this.input.focus();
    }

    public focusPrevious(): void {
        if (this.activeElement) {
            const prevElement = this.activeElement.parentNode;
            if (prevElement && prevElement.previousSibling) {
                this.activeElement = prevElement.previousSibling.childNodes[1] as HTMLAnchorElement;
            }
        }

        //
        // const prevElement = this.activeElement.parentNode.previousSibling; //.parentNode
        // if (prevElement) {
        //     this.activeElement = prevElement.children[1] as HTMLAnchorElement; // .firstChild as HTMLAnchorElement;
        // }
    }

    public focusNext(): void {
        if (this.activeElement) {
            const nextElement = this.activeElement.parentNode;
            if (nextElement && nextElement.nextSibling) {
                this.activeElement = nextElement.nextSibling.childNodes[1] as HTMLAnchorElement;
            }
        }

        // const nextElement = this.activeElement.parentNode.nextSibling; // .parentNode
        // if (nextElement) {
        //     this.activeElement = nextElement.children[1] as HTMLAnchorElement;//.firstChild as HTMLAnchorElement;
        // }
    }

    public clearInput(): void {
        this.input.value = "";
    }

    public clearItems(): void {
        const list = document.getElementById(LaunchListView.listElementId);
        if (list) {
            this.htmlContainer.removeChild(list);
        }
    }

    private registerKeydownListener(): void {
        window.onkeydown = this.keydownNotifier.bind(this);
    }

    private keydownNotifier(ev: KeyboardEvent): void {
        switch(ev.key) {
            case "ArrowUp":
                this.presenter.onArrowUp();
                break;
            case "ArrowDown":
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

    private createSearchView(id: string): HTMLDivElement {
        // <input id="txt-search" type="text" placeholder="Search..." autofocus>
        const div = document.createElement("div");
        div.id = id;

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Type to search...";
        input.oninput = () => this.presenter.onInputChanged();

        div.appendChild(input);
        return div;
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