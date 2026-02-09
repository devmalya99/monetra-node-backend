import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../schema/schema";
import { signupSchema, signinSchema } from "../schema/validation";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { logger } from "../utils/logger";

import { randomUUID } from "node:crypto";

const signToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: "30d", // Refresh token logic can be added later as per requirements
    });
};

const createSendToken = (user: any, statusCode: number, res: Response) => {
    const token = signToken(user.id);

    const cookieOptions = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    res.cookie("jwt", token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    logger.info("Signup request received");

    // 1. Validate Input
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
        logger.error("Validation Error", validation.error);
        return next(new AppError(validation.error?.issues[0].message, 400));
    }

    const { email, password } = validation.data;

    // 2. Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
        logger.warn(`User creation failed: Email ${email} already exists`);
        return next(new AppError("Email already in use", 400));
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create User
    try {
        // Generate UUID explicitly so we can return it immediately
        const userId = randomUUID();

        await db.insert(users).values({
            id: userId,
            email,
            password: hashedPassword,
        });

        const newUser = {
            id: userId,
            email,
        }

        logger.success(`User created with ID: ${userId}`);
        createSendToken(newUser, 201, res);
    } catch (err: any) {
        logger.error("Database Insert Error", err);
        return next(new AppError("Failed to create user", 500));
    }
});

export const signin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    logger.info("Signin request received");

    // 1. Validate Input
    const validation = signinSchema.safeParse(req.body);
    if (!validation.success) {
        return next(new AppError("Please provide email and password", 400));
    }

    const { email, password } = validation.data;

    // 2. Check if user exists & password is correct
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !(await bcrypt.compare(password, user.password))) {
        logger.warn(`Auth failed for email: ${email}`);
        return next(new AppError("Incorrect email or password", 401));
    }

    // 3. Send Token
    logger.success(`User ${email} signed in successfully`);
    createSendToken(user, 200, res);
});
