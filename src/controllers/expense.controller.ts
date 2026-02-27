import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { addExpenseSchema, deleteExpenseSchema, updateBalanceSchema, searchExpenseSchema } from "../schema/validation";
import { AppError } from "../utils/AppError";
import * as expenseService from "../services/expense.service";
import { logger } from "../utils/logger";

export const addExpense = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1. Validate Input
    const validation = addExpenseSchema.safeParse(req.body);
    if (!validation.success) {
        logger.error("Validation Error", validation.error);
        return next(new AppError(validation.error.issues[0].message, 400));
    }

    const { amount, date, category, title } = validation.data;
    const userId = (req as any).user.id;
    logger.info(`💸 Adding new expense for user: ${userId}`);

    // 2. Call service use any to bypass strict type check between zod number and drizzle decimal string requirement if exists
    // The service expects insert model where amount can be number or string usually.
    await expenseService.addExpenseService({
        amount: amount.toString(),
        date: new Date(date),
        category,
        title,
        userId
    } as any);

    // 3. Send response
    res.status(201).json({
        status: "success",
        message: "Expense added successfully",
        data: {
            amount,
            date,
            category,
            title,
            userId
        }
    });
});

export const getExpenses = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    const expenses = await expenseService.getExpensesByUser(userId);

    const totalExpense = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount as string), 0);
    const allocatedBalance = await expenseService.getBalanceService(userId);
    const remainingBalance = allocatedBalance - totalExpense;

    res.status(200).json({
        status: "success",
        results: expenses.length,
        data: {
            totalExpense,
            allocatedBalance,
            remainingBalance,
            expenses
        }
    });
});

export const deleteExpense = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    // Validate params using Zod schema
    const validation = deleteExpenseSchema.safeParse(req.params);

    if (!validation.success) {
        logger.error("Validation Error", validation.error);
        return next(new AppError("Invalid ID format", 400));
    }

    const { id } = validation.data;

    await expenseService.deleteExpenseService(id, userId);

    res.status(204).json({
        status: "success",
        data: null
    });
});

export const updateBalance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const validation = updateBalanceSchema.safeParse(req.body);
    if (!validation.success) {
        logger.error("Validation Error", validation.error);
        return next(new AppError(validation.error.issues[0].message, 400));
    }

    const { amount } = validation.data;
    const userId = (req as any).user.id;
    logger.info(`💰 Updating balance for user: ${userId}`);

    await expenseService.updateBalanceService(userId, amount);

    res.status(200).json({
        status: "success",
        message: "Balance updated successfully",
        data: {
            amount,
            userId
        }
    });
});

export const getMonthlyBalance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;

    // fetch only the balance without querying expenses
    const allocatedBalance = await expenseService.getBalanceService(userId);

    // (Optional) We could return remaining balance here too, but simple monthlyBalance as requested
    res.status(200).json({
        status: "success",
        data: {
            allocatedBalance
        }
    });
});

export const getTopCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    // Default limit is 3, but can be overridden up to 5
    const limitParam = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const limit = isNaN(limitParam) || limitParam > 5 ? 5 : limitParam;

    const topCategories = await expenseService.getTopCategoriesService(userId, limit);

    res.status(200).json({
        status: "success",
        results: topCategories.length,
        data: {
            topCategories
        }
    });
});

export const searchExpenses = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;

    // Validate params using Zod schema
    const validation = searchExpenseSchema.safeParse(req.query);

    if (!validation.success) {
        logger.error("Validation Error", validation.error);
        return next(new AppError("Invalid search query format", 400));
    }

    const { query } = validation.data;

    const searchResults = await expenseService.searchExpensesService(userId, query);

    res.status(200).json({
        status: "success",
        results: searchResults.length,
        data: {
            searchResults
        }
    });
});
