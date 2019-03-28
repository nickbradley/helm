import {LaunchView} from "../views/LaunchView";
import {LaunchItem} from "../views/LaunchListView";
import {ResourceSearch, SearchResult} from "../models/ResourceSearch";
import {DataManager} from "../DataManager";
import {Resource} from "../models/Resource";
import {Platform} from "../../common/Platform";
import * as desktop from "desktop-native";

export class LaunchPresenter {
    private readonly view: LaunchView;
    private readonly model: ResourceSearch;
    private results: SearchResult<Resource>[];
    private openWindows: desktop.Window[];

    constructor(view: LaunchView) {
        this.results = [];
        this.view = view;
        const dataManager = new DataManager();
        this.model = new ResourceSearch(dataManager);
        this.openWindows = Platform.listWindows();
        // query and cache info about apps on the system
        Platform.listApplications();
    }

    public onVisible(): void {
        console.log("LaunchPresenter::onVisible()");
        // Force launch items to refresh
        this.onInputChanged();
        this.updateOpenWindowList();
        console.log("Done");
    }

    public onHidden(): void {
        // Blank the view to avoid refresh artifacts when the launcher is shown again.
        // Note: clearInput() does not invoke onInputChanged() saving a database query.
        this.view.clearInput();
        this.view.clearItems();
    }

    public onArrowUp(): void {
        this.view.focusPrevious();
    }

    public onArrowDown(): void {
        this.view.focusNext();
    }

    public onOtherKey(): void {
        this.view.focusInput();
    }

    public onLaunchItemSelected(item: LaunchItem): void {
        const result = this.getResultById(item.displayOrder);
        if (result) {
            result.record.open();
        }
    }

    public onInputChanged(): void {
        const input = this.view.input.value;
        this.results = this.model.execute(this.openWindows, input);
        const viewItems: LaunchItem[] = [];
        for (const result of this.results) {
            console.log("looking for appName", result.record.appName);
            const app = Platform.appCache.filter((app) => app.name === result.record.appName)[0];
            viewItems.push({
                displayOrder: result.id,
                text: result.record.reference,
                icon: app ? app.icon : "",
            });
        }
        this.view.bind(viewItems);
    }

    private getResultById(id: number): SearchResult<Resource> | null {
        for (const result of this.results) {
            if (result.id === id) {
                return result;
            }
        }
        return null;

    }

    private updateOpenWindowList(): void {
        this.openWindows = Platform.listWindows();
    }
}