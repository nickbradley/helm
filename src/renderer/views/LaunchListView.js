"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LaunchPresenter_1 = require("../presenters/LaunchPresenter");
class LaunchListView {
    constructor(container) {
        this.htmlContainer = container;
        const searchView = this.createSearchView(LaunchListView.inputElementId);
        this.htmlContainer.appendChild(searchView);
        this.input = searchView.getElementsByTagName("input")[0];
        this.activeElem = null;
        this.presenter = new LaunchPresenter_1.LaunchPresenter(this);
        this.registerKeydownListener();
        this.registerVisibilityListener();
        // tell the presenter we are visible since the visibilityListener won't pick up the initial load
        this.presenter.onVisible();
    }
    get activeElement() {
        return this.activeElem;
    }
    set activeElement(element) {
        this.activeElem = element;
        if (this.activeElem) {
            this.activeElem.focus();
        }
    }
    bind(items) {
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
        }
        else {
            this.htmlContainer.appendChild(frag);
        }
        // const firstListItem = document.getElementById(listId).firstChild;
        const listItem = document.getElementById(listId);
        if (listItem && listItem.firstChild) {
            // set the (anchor tag of the) first result as active
            this.activeElement = listItem.firstChild.childNodes[1];
        }
    }
    focusInput() {
        this.input.focus();
    }
    focusPrevious() {
        if (this.activeElement) {
            const prevElement = this.activeElement.parentNode;
            if (prevElement && prevElement.previousSibling) {
                this.activeElement = prevElement.previousSibling.childNodes[1];
            }
        }
        //
        // const prevElement = this.activeElement.parentNode.previousSibling; //.parentNode
        // if (prevElement) {
        //     this.activeElement = prevElement.children[1] as HTMLAnchorElement; // .firstChild as HTMLAnchorElement;
        // }
    }
    focusNext() {
        if (this.activeElement) {
            const nextElement = this.activeElement.parentNode;
            if (nextElement && nextElement.nextSibling) {
                this.activeElement = nextElement.nextSibling.childNodes[1];
            }
        }
        // const nextElement = this.activeElement.parentNode.nextSibling; // .parentNode
        // if (nextElement) {
        //     this.activeElement = nextElement.children[1] as HTMLAnchorElement;//.firstChild as HTMLAnchorElement;
        // }
    }
    clearInput() {
        this.input.value = "";
    }
    clearItems() {
        const list = document.getElementById(LaunchListView.listElementId);
        if (list) {
            this.htmlContainer.removeChild(list);
        }
    }
    registerKeydownListener() {
        window.onkeydown = this.keydownNotifier.bind(this);
    }
    keydownNotifier(ev) {
        switch (ev.key) {
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
    registerVisibilityListener() {
        document.onvisibilitychange = () => {
            switch (document.visibilityState) {
                case "hidden":
                    this.presenter.onHidden();
                    break;
                case "visible":
                    this.presenter.onVisible();
                    break;
            }
        };
    }
    createSearchView(id) {
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
    static createListContainer(id) {
        const ol = document.createElement("ol");
        ol.id = id;
        return ol;
    }
    createListElement(item) {
        // need to create anchor tag so we have something to focus
        const a = document.createElement("a");
        a.href = "#";
        a.tabIndex = 0;
        a.innerText = item.text;
        a.onclick = (e) => {
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
LaunchListView.inputElementId = "input-view";
LaunchListView.listElementId = "launch-items";
exports.LaunchListView = LaunchListView;
//# sourceMappingURL=LaunchListView.js.map