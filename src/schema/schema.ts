import { mysqlTable, varchar, timestamp, decimal } from "drizzle-orm/mysql-core";
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
