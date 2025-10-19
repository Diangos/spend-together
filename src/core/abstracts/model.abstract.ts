import {DB} from "~/db/db.ts";

export abstract class Model {
    public pool;

    constructor() {
        // deno-lint-ignore no-explicit-any
        this.pool = DB.instance.pool as any;
    }
}