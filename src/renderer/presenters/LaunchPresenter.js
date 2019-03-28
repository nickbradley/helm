"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResourceSearch_1 = require("../models/ResourceSearch");
const DataManager_1 = require("../DataManager");
const Platform_1 = require("../../common/Platform");
class LaunchPresenter {
    constructor(view) {
        this.results = [];
        this.view = view;
        const dataManager = new DataManager_1.DataManager("/home/ncbradley/.local/share/activitywatch/aw-server/peewee-sqlite.v2.db");
        this.model = new ResourceSearch_1.ResourceSearch(dataManager);
        this.openWindows = Platform_1.Platform.listWindows();
        // query and cache info about apps on the system
        Platform_1.Platform.listApplications();
    }
    onVisible() {
        // Force launch items to refresh
        this.onInputChanged();
        this.updateOpenWindowList();
    }
    onHidden() {
        // Blank the view to avoid refresh artifacts when the launcher is shown again.
        // Note: clearInput() does not invoke onInputChanged() saving a database query.
        this.view.clearInput();
        this.view.clearItems();
    }
    onArrowUp() {
        this.view.focusPrevious();
    }
    onArrowDown() {
        this.view.focusNext();
    }
    onOtherKey() {
        this.view.focusInput();
    }
    onLaunchItemSelected(item) {
        const result = this.getResultById(item.displayOrder);
        if (result) {
            result.record.open();
        }
    }
    onInputChanged() {
        const input = this.view.input.value;
        this.results = this.model.execute(this.openWindows, input);
        const viewItems = [];
        for (const result of this.results) {
            console.log("looking for appName", result.record.appName);
            const app = Platform_1.Platform.appCache.filter((app) => app.name === result.record.appName)[0];
            viewItems.push({
                displayOrder: result.id,
                text: result.record.reference,
                icon: app ? app.icon : "",
            });
        }
        this.view.bind(viewItems);
    }
    getResultById(id) {
        for (const result of this.results) {
            if (result.id === id) {
                return result;
            }
        }
        return null;
    }
    updateOpenWindowList() {
        this.openWindows = Platform_1.Platform.listWindows();
    }
}
exports.LaunchPresenter = LaunchPresenter;
//# sourceMappingURL=LaunchPresenter.js.map