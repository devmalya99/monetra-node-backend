import { registry } from '../openAPIRegistry';
import { z } from 'zod';
import { addExpenseSchema, deleteExpenseSchema, updateBalanceSchema, searchExpenseSchema } from '../../schema/validation';

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
                                userId: z.uuid(),
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
                                totalExpense: z.number().openapi({ example: 45.50 }),
                                allocatedBalance: z.number().openapi({ example: 5000.00 }),
                                remainingBalance: z.number().openapi({ example: 4954.50 }),
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

    // Update Balance
    registry.registerPath({
        method: 'post',
        path: '/user/update-balance',
        tags: ['Expense'],
        summary: 'Update or set the monthly allocated balance',
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateBalanceSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Balance updated successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            message: z.string().openapi({ example: 'Balance updated successfully' }),
                            data: z.object({
                                amount: z.number().openapi({ example: 5000.00 }),
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

    // Get Monthly Balance
    registry.registerPath({
        method: 'get',
        path: '/user/monthly-balance',
        tags: ['Expense'],
        summary: 'Get the monthly allocated balance for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Balance retrieved successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            data: z.object({
                                allocatedBalance: z.number().openapi({ example: 5000.00 }),
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

    // Get Top Categories
    registry.registerPath({
        method: 'get',
        path: '/user/top-categories',
        tags: ['Expense'],
        summary: 'Get the top spending categories (up to limit, max 5) for the authenticated user',
        security: [{ bearerAuth: [] }],
        request: {
            query: z.object({
                limit: z.coerce.number().min(1).max(5).optional().openapi({ example: 3 })
            })
        },
        responses: {
            200: {
                description: 'Top categories retrieved successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            results: z.number().openapi({ example: 3 }),
                            data: z.object({
                                topCategories: z.array(z.object({
                                    category: z.string().openapi({ example: 'Food' }),
                                    totalAmount: z.number().openapi({ example: 450.50 })
                                }))
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

    // Search Expenses
    registry.registerPath({
        method: 'get',
        path: '/user/search-expenses',
        tags: ['Expense'],
        summary: 'Search expenses by name/title or category',
        security: [{ bearerAuth: [] }],
        request: {
            query: searchExpenseSchema
        },
        responses: {
            200: {
                description: 'Search results retrieved successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            results: z.number().openapi({ example: 2 }),
                            data: z.object({
                                searchResults: z.array(
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
                                )
                            }),
                        }),
                    },
                },
            },
            400: {
                description: 'Invalid search query format',
            },
            401: {
                description: 'Unauthorized - Missing or invalid token',
            },
        },
    });
};
