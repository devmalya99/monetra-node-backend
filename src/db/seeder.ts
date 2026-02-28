import { db } from "./index";
import { membershipPlans } from "../schema/schema";
import { logger } from "../utils/logger";

export const seedPremiumMemberships = async () => {
    try {
        const memberships = [
            { id: "pro_plan", tier: "pro", price: "499.00", tenure: "year" },
            { id: "ultra_plan", tier: "ultra", price: "1499.00", tenure: "year" },
            { id: "max_plan", tier: "max", price: "1999.00", tenure: "year" },
        ];

        // Check if data already exists
        const existingData = await db.select().from(membershipPlans);
        if (existingData.length === 0) {
            await db.insert(membershipPlans).values(memberships);
            logger.success("🌱 Premium membership plans seeded successfully!");
        } else {
            logger.info("⚡ Premium membership plans already exist, skipping seed.");
        }
    } catch (error) {
        logger.error("Failed to seed premium memberships:", error);
    }
};
