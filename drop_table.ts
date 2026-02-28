import { sql } from "drizzle-orm";
import { db } from "./src/db/index";
async function run() {
    await db.execute(sql`DROP TABLE IF EXISTS premium_membership_data;`);
    console.log("Dropped table");
    process.exit(0);
}
run();
