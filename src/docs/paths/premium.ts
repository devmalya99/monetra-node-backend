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
                                })
                            })
                        })
                    }
                }
            },
            400: { description: 'Bad Request' },
            404: { description: 'Membership Not Found' }
        }
    });
}
