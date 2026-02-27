import { db } from "../db";
import { expenses } from "../schema/schema";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { eq, and, desc, sql, or } from "drizzle-orm";

type NewExpense = typeof expenses.$inferInsert;

export const addExpenseService = async (data: NewExpense) => {
    try {
        await db.insert(expenses).values(data);
        logger.info(`Expense added for user: ${data.userId}`);
    } catch (error) {
        logger.error("Error adding expense", error);
        throw new AppError("Failed to add expense", 500);
    }
};

export const getExpensesByUser = async (userId: string) => {
    try {
        const userExpenses = await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.date));
        return userExpenses;
    } catch (error) {
        logger.error("Error fetching expenses", error);
        throw new AppError("Failed to fetch expenses", 500);
    }
};

export const deleteExpenseService = async (expenseId: string, userId: string) => {
    try {
        const deletedExpense = await db.delete(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));
        // Drizzle delete result usually has affectedRows
        // But for safety, we return void or check if needed.
        if (deletedExpense[0].affectedRows === 0) {
            throw new AppError("Expense not found or unauthorized", 404);
        }
        logger.info(`Expense deleted: ${expenseId} by user: ${userId}`);
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error("Error deleting expense", error);
        throw new AppError("Failed to delete expense", 500);
    }
};

export const updateBalanceService = async (userId: string, amount: number) => {
    try {
        await db.insert(require("../schema/schema").balances)
            .values({ userId, amount: amount.toString() })
            .onDuplicateKeyUpdate({ set: { amount: amount.toString() } });
        logger.info(`Balance updated for user: ${userId}`);
    } catch (error) {
        logger.error("Error updating balance", error);
        throw new AppError("Failed to update balance", 500);
    }
};

export const getBalanceService = async (userId: string) => {
    try {
        const balanceRecord = await db.select().from(require("../schema/schema").balances).where(eq(require("../schema/schema").balances.userId, userId));
        return balanceRecord.length > 0 ? parseFloat(balanceRecord[0].amount) : 0;
    } catch (error) {
        logger.error("Error fetching balance", error);
        throw new AppError("Failed to fetch balance", 500);
    }
};

export const getTopCategoriesService = async (userId: string, limit: number = 3) => {
    try {
        const topCategories = await db
            .select({
                category: expenses.category,
                totalAmount: sql<number>`SUM(${expenses.amount})`.mapWith(Number),
            })
            .from(expenses)
            .where(eq(expenses.userId, userId))
            .groupBy(expenses.category)
            .orderBy(desc(sql`SUM(${expenses.amount})`))
            .limit(limit);

        return topCategories;
    } catch (error) {
        logger.error("Error fetching top categories", error);
        throw new AppError("Failed to fetch top categories", 500);
    }
};

export const searchExpensesService = async (userId: string, queryTerm: string) => {
    try {
        const searchTerm = `%${queryTerm}%`;
        const searchResults = await db
            .select()
            .from(expenses)
            .where(
                and(
                    eq(expenses.userId, userId),
                    or(
                        sql`${expenses.title} LIKE ${searchTerm}`,
                        sql`${expenses.category} LIKE ${searchTerm}`
                    )
                )
            )
            .orderBy(desc(expenses.date));
        return searchResults;
    } catch (error) {
        logger.error("Error searching expenses", error);
        throw new AppError("Failed to search expenses", 500);
    }
};
