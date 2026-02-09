
import { z } from "zod";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const signupSchema = z.object({
    email: z.email().openapi({ example: "user@example.com" }),
    password: z.string().min(6).openapi({ example: "password123" }),
}).openapi("Signup");

export const signinSchema = z.object({
    email: z.email().openapi({ example: "user@example.com" }),
    password: z.string().openapi({ example: "password123" }),
}).openapi("Signin");

export const addExpenseSchema = z.object({
    amount: z.number().positive().openapi({ example: 45.50 }),
    date: z.string().datetime().openapi({ example: "2024-05-20T10:00:00Z" }),
    category: z.string().min(1).openapi({ example: "Food" }),
    title: z.string().min(1).openapi({ example: "Lunch at Restaurant" }),
    userId: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
}).openapi("AddExpense");

export const deleteExpenseSchema = z.object({
    id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
}).openapi("DeleteExpense");

