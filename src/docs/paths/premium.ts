import { registry } from '../openAPIRegistry';
import { z } from 'zod';
import { verifyPremiumOrderSchema, verifyPaymentSchema } from '../../schema/validation';

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

    registry.registerPath({
        method: 'get',
        path: '/premium/user-data',
        tags: ['Premium'],
        summary: 'Get all user data including active membership',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'User data retrieved successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: "success" }),
                            data: z.object({
                                user: z.object({
                                    id: z.string(),
                                    fullName: z.string().nullable(),
                                    email: z.string(),
                                    phoneNumber: z.string().nullable(),
                                    isVerified: z.boolean(),
                                    mfaEnabled: z.boolean(),
                                    lastLoginAt: z.string().nullable(),
                                    role: z.string(),
                                    city: z.string().nullable(),
                                    countryCode: z.string().nullable(),
                                    currencyCode: z.string(),
                                    timezone: z.string().nullable(),
                                    profileImgUrl: z.string().nullable(),
                                    bio: z.string().nullable(),
                                    status: z.string(),
                                    createdAt: z.string().nullable(),
                                    updatedAt: z.string().nullable(),
                                }).openapi({ example: { id: "123", email: "user@example.com", fullName: null, phoneNumber: null, isVerified: false, mfaEnabled: false, lastLoginAt: null, role: "user", city: null, countryCode: null, currencyCode: "INR", timezone: null, profileImgUrl: null, bio: null, status: "active", createdAt: "2024-05-20T10:00Z", updatedAt: "2024-05-20T10:00Z" } }),
                                membership: z.object({
                                    id: z.string(),
                                    userId: z.string(),
                                    tier: z.string(),
                                    status: z.string(),
                                    currentPeriodStart: z.string(),
                                    currentPeriodEnd: z.string(),
                                    autoRenew: z.boolean(),
                                    createdAt: z.string(),
                                    updatedAt: z.string(),
                                }).nullable().openapi({ example: null })
                            })
                        })
                    }
                }
            },
            401: { description: 'Unauthorized' }
        }
    });

    registry.registerPath({
        method: 'post',
        path: '/premium/verify-payment',
        tags: ['Premium'],
        summary: 'Submit Razorpay signature and payment details to activate a subscription',
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: verifyPaymentSchema
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Payment Signature Verified & Upgrade Complete',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: "success" }),
                            message: z.string().openapi({ example: "Payment verified & membership upgraded successfully" })
                        })
                    }
                }
            },
            400: { description: 'Bad Request / Invalid Signature' }
        }
    });

    registry.registerPath({
        method: 'post',
        path: '/premium/razorpay-webhook',
        tags: ['Premium'],
        summary: 'External Async Webhook from Razorpay',
        request: {
            headers: z.object({
                'x-razorpay-signature': z.string().openapi({ description: 'Razorpay HMAC Signature' })
            }),
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            event: z.string().openapi({ example: "payment.captured" }),
                            payload: z.any()
                        })
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Webhook processed',
                content: {
                    'application/json': {
                        schema: z.object({
                            status: z.string().openapi({ example: "success" })
                        })
                    }
                }
            },
            400: { description: 'Invalid Signature' }
        }
    });
}
