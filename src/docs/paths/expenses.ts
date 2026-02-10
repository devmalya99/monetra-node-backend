import { registry } from '../openAPIRegistry';
import { z } from 'zod';
import { addExpenseSchema, deleteExpenseSchema } from '../../schema/validation';

export const registerExpensePaths = () => {
    // Add Expense
    registry.registerPath({
        method: 'post',
        path: '/user/add-expense',
        tags: ['Expense'],
        summary: 'Add a new expense',
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: addExpenseSchema,
                    },
                },
            },
        },
        responses: {
            201: {
                description: 'Expense added successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            message: z.string().openapi({ example: 'Expense added successfully' }),
                            data: z.object({
                                amount: z.number().openapi({ example: 45.50 }),
                                date: z.iso.datetime().openapi({ example: "2024-05-20T10:00:00Z" }),
                                category: z.string().openapi({ example: "Food" }),
                                title: z.string().openapi({ example: "Lunch" }),
                                userId: z.string().uuid(),
                            }),
                        }),
                    },
                },
            },
            400: {
                description: 'Validation error',
            },
            401: {
                description: 'Unauthorized - Missing or invalid token',
            },
        },
    });

    // Get Expenses
    registry.registerPath({
        method: 'get',
        path: '/user/my-expenses',
        tags: ['Expense'],
        summary: 'Get all expenses for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Expenses retrieved successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            results: z.number().openapi({ example: 5 }),
                            data: z.object({
                                expenses: z.array(
                                    z.object({
                                        id: z.string().uuid(),
                                        userId: z.string().uuid(),
                                        amount: z.string().openapi({ example: "45.50" }),
                                        date: z.string().datetime().or(z.date()).openapi({ example: "2024-05-20T10:00:00Z" }),
                                        category: z.string().openapi({ example: "Food" }),
                                        title: z.string().openapi({ example: "Lunch at Restaurant" }),
                                        createdAt: z.string().datetime().or(z.date()).optional(),
                                        updatedAt: z.string().datetime().or(z.date()).optional(),
                                    })
                                ),
                            }),
                        }),
                    },
                },
            },
            401: {
                description: 'Unauthorized - Missing or invalid token',
            },
        },
    });

    // Delete Expense
    registry.registerPath({
        method: 'delete',
        path: '/user/delete-expense/{id}',
        tags: ['Expense'],
        summary: 'Delete an expense by ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: deleteExpenseSchema,
        },
        responses: {
            204: {
                description: 'Expense deleted successfully',
            },
            400: {
                description: 'Invalid ID format',
            },
            401: {
                description: 'Unauthorized - Missing or invalid token',
            },
            404: {
                description: 'Expense not found or not owned by user',
            },
        },
    });
};
