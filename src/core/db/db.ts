import {config} from "https://deno.land/x/dotenv/mod.ts";
import mysql from "npm:mysql2/promise";

export class DB {
    private static _instance: DB;

    public static get instance(): DB {
        if (!DB._instance) {
            DB._instance = new DB();
        }
        return DB._instance;
    };

    public pool!: mysql.Pool;

    private constructor() {
        if (DB._instance) {
            return DB._instance;
        }

        const env = config();

        this.pool = mysql.createPool({
            host: env.DB_HOST,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }
}