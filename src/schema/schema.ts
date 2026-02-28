import { mysqlTable, varchar, timestamp, decimal, boolean, json } from "drizzle-orm/mysql-core";
import { randomUUID } from "node:crypto";

export const users = mysqlTable("users", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const expenses = mysqlTable("expenses", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    date: timestamp("date").notNull(),
    category: varchar("category", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const balances = mysqlTable("balances", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 }).notNull().unique(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow(),
});

export const premiumMembershipData = mysqlTable("premium_membership_data", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 }).notNull().unique(), // FK to users
    tier: varchar("tier", { length: 50 }).notNull(), // pro / ultra / max
    status: varchar("status", { length: 50 }).notNull(), // active, canceled, expired, past_due
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    autoRenew: boolean("auto_renew").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const orders = mysqlTable("orders", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 }).notNull(), // FK to users
    membershipId: varchar("membership_id", { length: 36 }), // FK to premium_membership_data
    paymentSessionId: varchar("payment_session_id", { length: 255 }).unique(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(), // pending, succeeded, failed, refunded
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const membershipPlans = mysqlTable("membership_plans", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    tier: varchar("tier", { length: 50 }).notNull().unique(), // pro / ultra / max
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    tenure: varchar("tenure", { length: 50 }).notNull().default("year"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
