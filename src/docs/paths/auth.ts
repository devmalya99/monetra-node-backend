import { registry } from '../openAPIRegistry';
import { z } from 'zod';
import { signupSchema, signinSchema, resetPasswordRequestSchema } from '../../schema/validation';

export const registerAuthPaths = () => {
    registry.registerPath({
        method: 'post',
        path: '/user/signup',
        tags: ['Auth'],
        summary: 'Register a new user',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: signupSchema,
                    },
                },
            },
        },
        responses: {
            201: {
                description: 'User created successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            token: z.string().openapi({ example: 'jwt_token' }),
                            data: z.object({
                                user: z.object({
                                    id: z.string().uuid(),
                                    email: z.string().email(),
                                }),
                            }),
                        }),
                    },
                },
            },
            400: { description: 'Validation error or Email already exists' },
            500: { description: 'Internal server error' },
        },
    });

    registry.registerPath({
        method: 'post',
        path: '/user/signin',
        tags: ['Auth'],
        summary: 'Login user',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: signinSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Login successful',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            token: z.string().openapi({ example: 'jwt_token' }),
                            data: z.object({
                                user: z.object({
                                    id: z.string().uuid(),
                                    email: z.string().email(),
                                }),
                            }),
                        }),
                    },
                },
            },
            400: { description: 'Invalid input' },
            401: { description: 'Incorrect email or password' },
        },
    });

    registry.registerPath({
        method: 'post',
        path: '/user/request-password-reset',
        tags: ['Auth'],
        summary: 'Request a password reset email',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: resetPasswordRequestSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Reset request processed successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            message: z.string().openapi({ example: 'If that email exists, a reset link has been sent.' }),
                        }),
                    },
                },
            },
            400: { description: 'Invalid email format' },
            500: { description: 'Internal server error or Email provider error' },
        },
    });

    // Consolidated Reset Password Path
    registry.registerPath({
        method: 'get',
        path: '/user/reset-password/{id}',
        tags: ['Auth'],
        summary: 'Verify request ID (from email link) and redirect to frontend',
        request: {
            params: z.object({
                id: z.string().uuid(),
            }),
        },
        responses: {
            302: { description: 'Redirecting to frontend reset page' },
            400: { description: 'Invalid or expired link' },
        },
    });

    registry.registerPath({
        method: 'post',
        path: '/user/reset-password/{id}',
        tags: ['Auth'],
        summary: 'Reset user password using session Request ID',
        request: {
            params: z.object({
                id: z.string().uuid(),
            }),
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            password: z.string().min(6),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Password reset successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: 'success' }),
                            message: z.string().openapi({ example: 'Password has been successfully reset.' }),
                        }),
                    },
                },
            },
            400: { description: 'Validation error or link expired' },
            404: { description: 'User not found' },
            500: { description: 'Internal server error' },
        },
    });
};
