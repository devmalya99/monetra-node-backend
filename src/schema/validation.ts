
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
