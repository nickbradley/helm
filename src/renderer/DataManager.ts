import * as Database from "better-sqlite3";

export class DataManager {
    private readonly db: Database.Database;

    constructor(filename: string) {
        this.db = new Database(filename, { readonly: true })   ;
    }

    public prepare(source: string): Database.Statement {
        return this.db.prepare(source);
    }

    public static all(statement: Database.Statement, ...params: any[]): any[] {
        return statement.all(params);
    }
}
