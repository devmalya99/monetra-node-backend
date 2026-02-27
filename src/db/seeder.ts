import { db } from "./index";
import { premiumMembershipData } from "../schema/schema";
import { logger } from "../utils/logger";

export const seedPremiumMemberships = async () => {
    try {
        const memberships = [
            { tier: "pro", price: "499.00", tenure: "year" },
            { tier: "ultra", price: "1499.00", tenure: "year" },
            { tier: "max", price: "1999.00", tenure: "year" },
        ];

        // Check if data already exists
        const existingData = await db.select().from(premiumMembershipData);
        if (existingData.length === 0) {
            await db.insert(premiumMembershipData).values(memberships);
            logger.success("🌱 Premium membership data seeded successfully!");
        } else {
            logger.info("⚡ Premium membership data already exists, skipping seed.");
        }
    } catch (error) {
        logger.error("Failed to seed premium memberships:", error);
    }
};
