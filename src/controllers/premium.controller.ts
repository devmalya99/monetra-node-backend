import { Request, Response } from "express";
import { db } from "../db";
import { premiumMembershipData } from "../schema/schema";
import { eq } from "drizzle-orm";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

export const verifyPremiumOrder = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.body;

    if (!id) {
        throw new AppError("Membership ID is required", 400);
    }

    const membership = await db.select().from(premiumMembershipData).where(eq(premiumMembershipData.id, id));

    if (membership.length === 0) {
        throw new AppError("Invalid membership ID", 404);
    }

    res.status(200).json({
        status: "success",
        message: "Premium order verified successfully",
        data: {
            membership: membership[0]
        }
    });
});

export const getPremiumMemberships = catchAsync(async (req: Request, res: Response) => {
    const memberships = await db.select().from(premiumMembershipData);

    res.status(200).json({
        status: "success",
        data: {
            memberships
        }
    });
});
