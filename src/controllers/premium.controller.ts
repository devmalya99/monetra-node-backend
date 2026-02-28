import { Request, Response } from "express";
import { db } from "../db";
import { premiumMembershipData, membershipPlans, orders, expenses, users } from "../schema/schema";
import { eq, desc, sql } from "drizzle-orm";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

import { RazorpayApp } from "../config/razorpay";
import crypto from "crypto";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";


export const verifyPremiumOrder = catchAsync(async (req: Request, res: Response) => {
    const { membership_id } = req.body;
    const user = (req as any).user;

    if (!membership_id) {
        throw new AppError("Membership ID is required", 400);
    }

    const internal_order_id = `order_${Date.now()}_${user.id.substring(0, 8)}`;

    const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, membership_id));

    if (!plan) {
        throw new AppError("Invalid membership ID", 404);
    }

    const options = {
        amount: Number(plan.price) * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
        currency: "INR",
        receipt: internal_order_id, // Use this to track the order ID in your system
        notes: {
            // Razorpay stores extra metadata in the 'notes' object
            customer_id: user.id,
            customer_name: user.email.split('@')[0],
            customer_email: user.email,
            customer_phone: "9876543210",
            membership_id: membership_id,
            order_id: internal_order_id
        }
    };

    // Now create the order using the instance
    const order = await RazorpayApp.orders.create(options);
    console.log("order data from razorpay", order);

    // Track the intended order inside the database BEFORE responding to frontend
    await db.insert(orders).values({
        id: internal_order_id,
        userId: user.id,
        membershipId: membership_id,
        paymentSessionId: order.id,
        amount: plan.price.toString(),
        currency: "INR",
        status: "pending",
        metadata: order
    });

    res.status(200).json({
        status: "success",
        message: "Premium order created successfully",
        data: {
            membership: plan,
            internal_order_id: internal_order_id,
            razorpay_order_data: order,
        },
    });
});


export const handleRazorpayWebhook = catchAsync(async (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // 1. Verify the webhook signature to ensure it's actually from Razorpay
    const isValid = validateWebhookSignature(JSON.stringify(req.body), signature as string, webhookSecret as string);

    if (!isValid) {
        return res.status(400).json({ status: "failure", message: "Invalid signature" });
    }

    const event = req.body.event; // e.g., 'payment.captured'

    if (event === 'payment.captured') {
        const payment = req.body.payload.payment.entity;

        // Fetch the user's purchased plan from the metadata attached during order creation
        const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, payment.notes.membership_id));

        if (plan) {
            const currentPeriodStart = new Date();
            const currentPeriodEnd = new Date();
            if (plan.tenure === 'monthly') currentPeriodEnd.setMonth(currentPeriodStart.getMonth() + 1);
            else currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + 1); // Default to year

            const [existing] = await db.select().from(premiumMembershipData).where(eq(premiumMembershipData.userId, payment.notes.customer_id));

            if (existing) {
                // Update the existing subscription
                await db.update(premiumMembershipData)
                    .set({
                        tier: plan.tier,
                        status: 'active',
                        currentPeriodStart,
                        currentPeriodEnd
                    })
                    .where(eq(premiumMembershipData.id, existing.id));
            } else {
                // Create a new subscription entry
                await db.insert(premiumMembershipData).values({
                    userId: payment.notes.customer_id,
                    tier: plan.tier,
                    status: 'active',
                    currentPeriodStart,
                    currentPeriodEnd,
                    autoRenew: true
                });
            }

            // Mark the exact order inside MySQL as successful using the ID passed via notes explicitly!
            if (payment.notes.order_id) {
                await db.update(orders)
                    .set({ status: 'succeeded' })
                    .where(eq(orders.id, payment.notes.order_id));
            }

            console.log("✅ Webhook processed: Membership upgraded for", payment.notes.customer_email);
        }
    }

    res.status(200).json({ status: "success" });
});

export const verifyPayment = catchAsync(async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, membership_id } = req.body;
    const user = (req as any).user;

    console.log("razorpay_order_id", razorpay_order_id);
    if (!razorpay_order_id) {
        throw new AppError("Razorpay order ID is required", 400);
    }
    console.log("razorpay_payment_id", razorpay_payment_id);
    if (!razorpay_payment_id) {
        throw new AppError("Razorpay payment ID is required", 400);
    }
    console.log("razorpay_signature", razorpay_signature);
    if (!razorpay_signature) {
        throw new AppError("Razorpay signature is required", 400);
    }
    console.log("membership_id", membership_id);
    if (!membership_id) {
        throw new AppError("Membership ID is required", 400);
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string);

    // Create the signature locally and compare it to the one sent from frontend
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
        // Success: Transaction is verified

        // 1. Fetch Membership Plan
        const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, membership_id));
        if (!plan) {
            return res.status(400).json({ status: "failure", message: "Membership plan not found" });
        }

        // 2. Set expiry
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        if (plan.tenure === 'monthly') currentPeriodEnd.setMonth(currentPeriodStart.getMonth() + 1);
        else currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + 1); // Default to year

        // 3. Upsert into `premium_membership_data`
        const [existing] = await db.select().from(premiumMembershipData).where(eq(premiumMembershipData.userId, user.id));

        if (existing) {
            // Update the existing subscription to active
            await db.update(premiumMembershipData)
                .set({
                    tier: plan.tier,
                    status: 'active',
                    currentPeriodStart,
                    currentPeriodEnd
                })
                .where(eq(premiumMembershipData.id, existing.id));
        } else {
            // Create a new subscription
            await db.insert(premiumMembershipData).values({
                userId: user.id,
                tier: plan.tier,
                status: 'active',
                currentPeriodStart,
                currentPeriodEnd,
                autoRenew: true
            });
        }

        // 4. Update order status to succeeded
        await db.update(orders)
            .set({ status: 'succeeded' })
            .where(eq(orders.paymentSessionId, razorpay_order_id));

        res.status(200).json({ status: "success", message: "Payment verified & membership upgraded successfully" });
    } else {
        // Fail: Signature mismatch
        res.status(400).json({ status: "failure", message: "Invalid signature" });
    }
});

export const getPremiumMemberships = catchAsync(async (req: Request, res: Response) => {
    const plans = await db.select().from(membershipPlans);

    res.status(200).json({
        status: "success",
        data: {
            memberships: plans
        }
    });
});

export const getLeaderboard = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;

    // Calculate total spend per user
    const allSpenders = await db
        .select({
            userId: expenses.userId,
            email: users.email,
            totalSpent: sql<number>`sum(${expenses.amount})`.mapWith(Number),
        })
        .from(expenses)
        .leftJoin(users, eq(expenses.userId, users.id))
        .groupBy(expenses.userId)
        .orderBy(desc(sql<number>`sum(${expenses.amount})`));

    const top10 = allSpenders.slice(0, 10).map((spender, index) => ({
        rank: index + 1,
        email: spender.email,
        totalSpent: spender.totalSpent,
    }));

    const currentUserIndex = allSpenders.findIndex(s => s.userId === user.id);
    const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : null;
    const currentUserTotal = currentUserIndex !== -1 ? allSpenders[currentUserIndex].totalSpent : 0;

    res.status(200).json({
        status: "success",
        data: {
            top10,
            currentUser: {
                rank: currentUserRank,
                totalSpent: currentUserTotal,
            }
        }
    });
});

export const getUserData = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;

    // Remove password hash from response
    user.password = undefined;

    const [membership] = await db.select()
        .from(premiumMembershipData)
        .where(eq(premiumMembershipData.userId, user.id));

    res.status(200).json({
        status: "success",
        data: {
            user,
            membership: membership || null
        }
    });
});
