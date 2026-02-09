import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { addExpenseSchema, deleteExpenseSchema } from "../schema/validation";
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

    res.status(200).json({
        status: "success",
        results: expenses.length,
        data: {
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
