import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, forgotPasswordRequests } from "../schema/schema";
import { signupSchema, signinSchema, resetPasswordRequestSchema, resetPasswordSchema } from "../schema/validation";
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

    // Creating a record in forgot_password_requests table
    const requestId = randomUUID();
    await db.insert(forgotPasswordRequests).values({
        id: requestId,
        userId: user.id,
        isActive: true,
    });

    // Creating the reset URL which calls the backend's GET verification endpoint first
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 9100}`;
    const resetUrl = `${backendUrl}/user/reset-password/${requestId}`;

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

        logger.success(`Password reset email sent for: ${email}. Request ID: ${requestId}`);
    } catch (err: any) {
        logger.error("Error communicating with Brevo SDK", err);
        return next(new AppError("Failed to send reset email.", 500));
    }

    res.status(200).json({ status: "success", message: "If that email exists, a reset link has been sent." });
});

export const verifyResetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
        logger.warn(`Invalid or expired password reset verification for Request ID: ${id}`);
        return res.status(400).send(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc3545;">Invalid or Expired Link</h2>
                <p>This password reset link is no longer valid. Please request a new one.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/forgot-password" style="color: #007bff; text-decoration: none;">Request New Link</a>
            </div>
        `);
    }

    const [request] = await db
        .select()
        .from(forgotPasswordRequests)
        .where(eq(forgotPasswordRequests.id, id as string));

    if (!request || !request.isActive) {
        logger.warn(`Invalid or expired password reset verification for Request ID: ${id}`);
        return res.status(400).send(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc3545;">Invalid or Expired Link</h2>
                <p>This password reset link is no longer valid. Please request a new one.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/forgot-password" style="color: #007bff; text-decoration: none;">Request New Link</a>
            </div>
        `);
    }

    // Check expiration (15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (request.createdAt && request.createdAt < fifteenMinutesAgo) {
        logger.warn(`Password reset link expired for Request ID: ${id}`);
        return res.status(400).send(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc3545;">Link Expired</h2>
                <p>This password reset link has expired (15 minute limit). Please request a new one.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/forgot-password" style="color: #007bff; text-decoration: none;">Request New Link</a>
            </div>
        `);
    }

    // Redirect to the frontend password reset page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${id}`);
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    logger.info("Reset password initialization...");

    const requestId = req.params.id as string;
    const validation = resetPasswordSchema.safeParse({ id: requestId, ...req.body });

    if (!validation.success) {
        return next(new AppError(validation.error.issues[0].message, 400));
    }

    const { password } = validation.data;

    // 1. Find the request in forgot_password_requests
    const [request] = await db
        .select()
        .from(forgotPasswordRequests)
        .where(eq(forgotPasswordRequests.id, requestId));

    if (!request || !request.isActive) {
        logger.warn(`Invalid or expired password reset attempt for Request ID: ${requestId}`);
        return next(new AppError("The reset link is invalid or has already been used.", 400));
    }

    // Check expiration (15 minutes) - important even for the POST submission
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (request.createdAt && request.createdAt < fifteenMinutesAgo) {
        logger.warn(`Password reset submission expired for Request ID: ${requestId}`);
        return next(new AppError("This reset sessions has expired (15 minute limit).", 400));
    }

    // 2. Find the associated user
    const [user] = await db.select().from(users).where(eq(users.id, request.userId));
    if (!user) {
        logger.error(`Reset Password failed: Associated User not found for Request ID ${requestId}.`);
        return next(new AppError("User not found.", 404));
    }

    // 3. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    try {
        await db.transaction(async (tx) => {
            // Update user password
            await tx
                .update(users)
                .set({ password: hashedPassword })
                .where(eq(users.id, user.id));

            // Deactivate the request
            await tx
                .update(forgotPasswordRequests)
                .set({ isActive: false })
                .where(eq(forgotPasswordRequests.id, requestId));
        });

        logger.success(`Password updated successfully for account: ${user.email} using Request ID: ${requestId}`);

        res.status(200).json({
            status: "success",
            message: "Password has been successfully reset. You can now log in with your new password.",
        });
    } catch (err: any) {
        logger.error("Password reset database error", err);
        return next(new AppError("An error occurred while resetting your password. Please try again.", 500));
    }
});
