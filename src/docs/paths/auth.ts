import { registry } from '../openAPIRegistry';
import { z } from 'zod';
import { signupSchema, signinSchema } from '../../schema/validation';

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
                            token: z.string().describe('JWT access token'),
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
            400: {
                description: 'Validation error or Email already exists',
            },
            500: {
                description: 'Internal server error',
            },
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
                            token: z.string().describe('JWT access token'),
                            data: z.object({
                                user: z.object({
                                    id: z.string().uuid(),
                                    email: z.email(),
                                }),
                            }),
                        }),
                    },
                },
            },
            400: {
                description: 'Invalid input',
            },
            401: {
                description: 'Incorrect email or password',
            },
        },
    });
};
