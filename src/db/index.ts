import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import * as schema from "../schema/schema";

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

// Remove ssl-mode from URL to avoid mysql2 warning as it's not a valid option key
const dbUrl = process.env.DATABASE_URL;

const connection = mysql.createPool({
    uri: dbUrl,
    ssl: {
        rejectUnauthorized: false,
    }
});

export const db = drizzle(connection, { schema, mode: "default" });
