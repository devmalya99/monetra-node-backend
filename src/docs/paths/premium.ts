import { registry } from '../openAPIRegistry';
import { z } from 'zod';
import { verifyPremiumOrderSchema } from '../../schema/validation';

export function registerPremiumPaths() {
    registry.registerPath({
        method: 'get',
        path: '/premium/memberships',
        tags: ['Premium'],
        summary: 'Get all premium memberships available',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'List of memberships',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: "success" }),
                            data: z.object({
                                memberships: z.array(z.object({
                                    id: z.string(),
                                    tier: z.string(),
                                    price: z.string(),
                                    tenure: z.string(),
                                    createdAt: z.string(),
                                    updatedAt: z.string(),
                                }))
                            })
                        })
                    }
                }
            }
        }
    });

    registry.registerPath({
        method: 'post',
        path: '/premium/verify-order',
        tags: ['Premium'],
        summary: 'Verify premium order matching by ID',
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: verifyPremiumOrderSchema
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Order Verified successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: "success" }),
                            message: z.string().openapi({ example: "Premium order verified successfully" }),
                            data: z.object({
                                membership: z.object({
                                    id: z.string(),
                                    tier: z.string(),
                                    price: z.string(),
                                    tenure: z.string(),
                                    createdAt: z.string(),
                                    updatedAt: z.string(),
                                }),
                                order_id: z.string().openapi({ example: "order_123456" }),
                                payment_session_id: z.string().openapi({ example: "session_xxx" })
                            })
                        })
                    }
                }
            },
            400: { description: 'Bad Request' },
            404: { description: 'Membership Not Found' }
        }
    });

    registry.registerPath({
        method: 'get',
        path: '/premium/leaderboard',
        tags: ['Premium'],
        summary: 'Get top 10 total spenders and current user rank',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Leaderboard retrieved successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: "success" }),
                            data: z.object({
                                top10: z.array(z.object({
                                    rank: z.number().openapi({ example: 1 }),
                                    email: z.string().openapi({ example: "user@example.com" }),
                                    totalSpent: z.number().openapi({ example: 45000.50 })
                                })),
                                currentUser: z.object({
                                    rank: z.number().nullable().openapi({ example: 42 }),
                                    totalSpent: z.number().openapi({ example: 1200.00 })
                                })
                            })
                        })
                    }
                }
            },
            401: { description: 'Unauthorized' }
        }
    });
}
