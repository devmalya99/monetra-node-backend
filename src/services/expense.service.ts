import { db } from "../db";
import { expenses, users } from "../schema/schema";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { eq, and, desc, sql, or } from "drizzle-orm";

type NewExpense = typeof expenses.$inferInsert;

export const addExpenseService = async (data: NewExpense) => {
    try {
        await db.insert(expenses).values(data);

        // Update user's totalExpense
        if (data.userId && data.amount) {
            await db.update(users)
                .set({ totalExpense: sql`${users.totalExpense} + ${data.amount}` })
                .where(eq(users.id, data.userId));
        }

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
        // Find the expense amount so we can correctly decrement the user's totalExpense
        const [expense] = await db.select().from(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));
        if (!expense) throw new AppError("Expense not found or unauthorized", 404);

        const deletedExpense = await db.delete(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));
        // Drizzle delete result usually has affectedRows
        // But for safety, we return void or check if needed.
        if (deletedExpense[0].affectedRows === 0) {
            throw new AppError("Expense not found or unauthorized", 404);
        }

        // Subtract the deleted amount from the user's totalExpense
        await db.update(users)
            .set({ totalExpense: sql`${users.totalExpense} - ${expense.amount}` })
            .where(eq(users.id, userId));

        logger.info(`Expense deleted: ${expenseId} by user: ${userId}`);
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error("Error deleting expense", error);
        throw new AppError("Failed to delete expense", 500);
    }
};

export const updateExpenseService = async (expenseId: string, userId: string, updateData: Partial<NewExpense>) => {
    try {
        const [existingExpense] = await db.select().from(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));
        if (!existingExpense) throw new AppError("Expense not found or unauthorized", 404);

        await db.update(expenses).set(updateData).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));

        // Update user's totalExpense if amount changed
        if (updateData.amount !== undefined) {
            const oldAmount = Number(existingExpense.amount);
            const newAmount = Number(updateData.amount);
            const difference = newAmount - oldAmount;

            if (difference !== 0) {
                await db.update(users)
                    .set({ totalExpense: sql`${users.totalExpense} + ${difference}` })
                    .where(eq(users.id, userId));
            }
        }

        logger.info(`Expense updated: ${expenseId} by user: ${userId}`);
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error("Error updating expense", error);
        throw new AppError("Failed to update expense", 500);
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
