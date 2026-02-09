import { db } from "../db";
import { expenses } from "../schema/schema";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { eq, and, desc } from "drizzle-orm";

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
