import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { addExpenseSchema, deleteExpenseSchema, updateBalanceSchema, searchExpenseSchema, updateExpenseSchema, suggestCategorySchema } from "../schema/validation";
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
    const user = (req as any).user;
    const expenses = await expenseService.getExpensesByUser(user.id);

    // Read natively directly from our optimized users DB table mapped object!
    const totalExpense = Number(user.totalExpense) || 0;

    const allocatedBalance = await expenseService.getBalanceService(user.id);
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

export const updateExpense = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    // Validate params and body using Zod schema
    const validation = updateExpenseSchema.safeParse({ id: req.params.id, ...req.body });

    if (!validation.success) {
        logger.error("Validation Error", validation.error);
        return next(new AppError("Invalid update data format", 400));
    }

    const { id, amount, date, category, title } = validation.data;

    // Construct updates object
    const updates: any = {};
    if (amount !== undefined) updates.amount = amount.toString();
    if (date !== undefined) updates.date = new Date(date);
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;

    if (Object.keys(updates).length === 0) {
        return next(new AppError("No fields to update", 400));
    }

    await expenseService.updateExpenseService(id, userId, updates);

    res.status(200).json({
        status: "success",
        message: "Expense updated successfully"
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

export const suggestCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const validation = suggestCategorySchema.safeParse(req.body);

    if (!validation.success) {
        logger.error("Validation Error", validation.error);
        return next(new AppError(validation.error.issues[0].message, 400));
    }

    const { title } = validation.data;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return next(new AppError("Gemini API key is not configured.", 500));
    }

    try {
        const prompt = `Classify the following expense title into a single-word, highly accurate category. Choose from a broad list such as: Food, Travel, Utilities, Entertainment, Sports, Fitness, Education, Shopping, Rent, Salary, Health, Electronics, Subscriptions, Groceries, or come up with an even better single word. Return ONLY the category word and nothing else without punctuation. Expense Title: "${title}"`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error('Gemini API request failed');
        }

        const responseData = await response.json();
        let category = responseData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Miscellaneous";

        // Strip any extra quotes or punctuation
        category = category.replace(/[^a-zA-Z]/g, '');

        if (!category) {
            category = "Miscellaneous";
        }

        res.status(200).json({
            status: "success",
            data: {
                category
            }
        });
    } catch (error) {
        logger.error("Error auto-suggesting category", error);
        return next(new AppError("Failed to auto-suggest category", 500));
    }
});
