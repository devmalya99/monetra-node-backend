import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../schema/schema";
import { signupSchema, signinSchema, resetPasswordRequestSchema } from "../schema/validation";
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
        secure: true, // Must be true for sameSite 'none' cross-domain cookies
        sameSite: "none" as const, // Allows browser to store cookies when Frontend / Backend are on different domains
    };

    res.cookie("jwt", token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
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

        await db.transaction(async (t) => {
            await t.insert(users).values({
                id: userId,
                email,
                password: hashedPassword,
            });
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

export const getMe = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    // We already have the user because of the protect middleware
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    });
};

export const logout = (req: Request, res: Response) => {
    res.cookie("jwt", "loggedout", {
        expires: new Date(0), // Expire immediately (epoch time)
        httpOnly: true,
    });
    res.status(200).json({ status: "success" });
};

export const requestPasswordReset = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    logger.info("Password reset request received");

    const validation = resetPasswordRequestSchema.safeParse(req.body);
    if (!validation.success) {
        return next(new AppError(validation.error.issues[0].message, 400));
    }

    const { email } = validation.data;

    const [user] = await db.select().from(users).where(eq(users.email, email));

    // To prevent email enumeration attacks, always respond the same way
    if (!user) {
        logger.warn(`Password reset requested for non-existent email: ${email}`);
        return res.status(200).json({ status: "success", message: "If that email exists, a reset link has been sent." });
    }

    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        logger.error("BREVO_API_KEY is not configured in environment variables.");
        return next(new AppError("Email service is not configured properly.", 500));
    }

    // Creating the reset URL requested. 
    // In production, generating a signed JWT token instead of raw ID is recommended!
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password/${user.id}`;

    try {
        const SibApiV3Sdk = require('sib-api-v3-sdk');
        let defaultClient = SibApiV3Sdk.ApiClient.instance;

        // Configure API key authorization: api-key
        let apiKeyAuth = defaultClient.authentications['api-key'];
        apiKeyAuth.apiKey = apiKey;

        let tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

        const senderEmail = process.env.BREVO_SENDER_EMAIL;
        if (!senderEmail) {
            logger.error("BREVO_SENDER_EMAIL is not configured in environment variables.");
            return next(new AppError("Email service sender is not configured properly.", 500));
        }

        let sender = {
            email: senderEmail,
            name: "Monetra Security",
        };

        let receivers = [
            {
                email: user.email,
            },
        ];

        let htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p style="color: #555;">Hello,</p>
                <p style="color: #555;">We received a request to reset your password. Click the button below to set a new password. This link contains your secure ID.</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p style="color: #555;">Or click this link text directly: <br> <a href="${resetUrl}">${resetUrl}</a></p>
                <p style="color: #555; margin-top: 30px; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `;

        const data = await tranEmailApi.sendTransacEmail({
            sender,
            to: receivers,
            subject: "Reset your Monetra Password",
            htmlContent: htmlContent,
        });

        logger.success(`Password reset email sent for: ${email}. ID: ${data.messageId}`);
    } catch (err: any) {
        logger.error("Error communicating with Brevo SDK", err);
        return next(new AppError("Failed to send reset email.", 500));
    }

    res.status(200).json({ status: "success", message: "If that email exists, a reset link has been sent." });
});
