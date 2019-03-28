import * as Database from "better-sqlite3";
import * as os from "os";
// import {app} from "electron";
// const remote = require('remote');
// const app = remote.require('app');


// const remote = require('electron').remote;
// const app = remote.app;

import {remote} from "electron";

export class DataManager {
    private readonly db: Database.Database;

    constructor(filename?: string) {
        let dbPath: string | undefined = filename;
        if (!dbPath) {
            dbPath = DataManager.getDBpath();
        }
        console.log("Opening SQLite DB", dbPath);
        this.db = new Database(dbPath, { readonly: true })   ;
    }

    public prepare(source: string): Database.Statement {
        return this.db.prepare(source);
    }

    public static all(statement: Database.Statement, ...params: any[]): any[] {
        return statement.all(params);
    }

    private static getDBpath(): string {
        let dbPath: string = "";
        switch (os.platform()) {
            case "darwin":
                dbPath = `${remote.app.getPath("home")}/Library/Application Support/activitywatch/aw-server/peewee-sqlite.v2.db`;
                break;
            case "win32":

                break;
            case "linux":
                dbPath = `${remote.app.getPath("home")}/.local/share/activitywatch/aw-server/peewee-sqlite.v2.db`;
                break;
        }
        return dbPath;
    }
}
