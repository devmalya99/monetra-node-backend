import { createServer } from "http";
import * as dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./utils/logger";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { seedPremiumMemberships } from "./db/seeder";

const PORT = process.env.PORT || 9100;

const server = createServer(app);

// Graceful Shutdown 🛑

//Handle synchronous exceptions
process.on("uncaughtException", (err) => {
    logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    process.exit(1);
});

async function startServer() {
    try {
        // Check DB connection
        // Drizzle with MySQL2 pool doesn't have an explicit 'connect' validation until query
        // So we try a simple query
        await db.execute(sql`SELECT 1`);
        logger.success("Database connection successful!");

        // Seed data
        await seedPremiumMemberships();

        server.listen(PORT, () => {
            console.log(`
    🚀  MONETRA BACKEND SERVER STARTED
    =============================================
    ✅  Port:           ${PORT}
    ✅  Mode:           ${process.env.NODE_ENV || "development"}
    ✅  Database:       Connected (MySQL via Drizzle)
    ✅  Documentation:  http://localhost:${PORT}/api-docs
    =============================================
            `);
            logger.info(`Server is ready to handle requests!`);
        });
    } catch (error) {
        logger.error("Failed to connect to database", error);
        process.exit(1);
    }
}

startServer();

//Handle unhandled promises - asynchronous exceptions
process.on("unhandledRejection", (err: any) => {
    logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
