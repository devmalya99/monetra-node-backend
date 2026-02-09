import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { db } from "../db";
import { users } from "../schema/schema";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger";

interface JwtPayload {
    id: string;
}

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError("You are not logged in! Please log in to get access.", 401));
    }

    try {
        // Verification
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        // Check if user still exists
        const [currentUser] = await db.select().from(users).where(eq(users.id, decoded.id));

        if (!currentUser) {
            return next(new AppError("The user belonging to this token no longer exists.", 401));
        }

        // Grant Access
        (req as any).user = currentUser;
        next();

    } catch (err) {
        logger.error("Token verification failed", err);
        return next(new AppError("Invalid token. Please log in again!", 401));
    }
});
