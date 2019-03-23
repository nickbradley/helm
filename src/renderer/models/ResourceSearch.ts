import {Statement} from "better-sqlite3";
import {DataManager} from "../DataManager";
import {Resource} from "./Resource";
import {ResourceFactory} from "./ResourceFactory";
import * as desktop from "desktop-native";

export interface SearchResult<T> {
    id: number;
    relevance: number;
    record: T;
}

export interface ResourceRecord {
    trackerName: string;
    appName: string;
    appTitle: string;
    reference: string;
    project: string;
    firstUse: string;
    lastUse: string;
    duration: number;
}

export class ResourceSearch {
    private readonly dataManager: DataManager;
    private readonly rankedResults: Statement;

    constructor(dataManager: DataManager) {
        this.dataManager = dataManager;

        this.rankedResults = dataManager.prepare(`
        with grouped as (
            select
                tracker_name,
                app_name,
                app_title,
                reference,
                project,
                min(timestamp) as first_use,
                max(timestamp) as last_use,
                sum(duration) as duration,
                count(*) as frequency,
                max(timestamp) as recency,
                sum(duration) as duration
            from resource
            where reference is not null and reference != 'Hello World!' -- helm title
            and project = COALESCE(?, (select project from resource order by timestamp desc limit 1))
            and reference LIKE @term OR app_title LIKE @term
            group by tracker_name, app_name, app_title, reference
        ), stats as (
            select
                tracker_name,
                app_name,
                app_title,
                reference,
                project,
                first_use,
                last_use,
                duration,
                percent_rank() over (order by frequency) as frequency_rank,
                percent_rank() over (order by recency) as recency_rank,
                percent_rank() over (order by duration) as duration_rank
            from grouped
        )
        select
            tracker_name as trackerName,
            app_name as appName,
            app_title as appTitle,
            reference,
            project,
            first_use as firstUse,
            last_use as lastUse,
            duration,
            0.8*recency_rank + 0.15 * frequency_rank + 0.05 * duration_rank as relevance
        from stats
        order by 0.8*recency_rank + 0.15 * frequency_rank + 0.05 * duration_rank desc
        limit 10;
    `);
    }

    public execute(openWindows: desktop.Window[], filter: string, project: string = null): Array<SearchResult<Resource>> {
        const results = [];
        let i = 0;
        const allResults = this.rankedResults.all(null, {term: `%${filter}%`});
        for (const result of allResults) {
            i += 1;
            let addRecord = false;
            switch (result.trackerName) {
                case "aw-watcher-window":
                    for (const window of openWindows) {
                        if (window.title === result.appTitle) {
                            addRecord = true;
                            break;
                        }
                    }
                    break;
                default:
                    addRecord = true;
                    break;
            }

            if (addRecord) {
                results.push({
                    id: i,
                    record: ResourceFactory.createResource(result),
                    // new Resource(result.first_use, result.last_use, result.duration, result.tracker_name,
                    // result.app_name, result.app_title, result.reference, result.project),
                    relevance: result.relevance,
                });
            }
        }
        return results;
    }
}
