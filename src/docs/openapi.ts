import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './openAPIRegistry';
import { registerAuthPaths } from './paths/auth';
import { registerExpensePaths } from './paths/expenses';
import { registerPremiumPaths } from './paths/premium';

// Register paths
registerAuthPaths();
registerExpensePaths();
registerPremiumPaths();

export function generateOpenAPI() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            version: '1.0.0',
            title: 'Monetra API',
            description: 'API Documentation for Monetra Expense Tracker',
            contact: {
                name: "Developer",
            },
        },
        servers: [
            {
                url: 'http://localhost:9100',
                description: 'Development server',
            },
        ],
    });
}
