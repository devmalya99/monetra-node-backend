import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { signinSchema, signupSchema, addExpenseSchema, deleteExpenseSchema, verifyPremiumOrderSchema } from '../schema/validation';

export const registry = new OpenAPIRegistry();

// Register Schemas
registry.register('Signup', signupSchema);
registry.register('Signin', signinSchema);
registry.register('AddExpense', addExpenseSchema);
registry.register('DeleteExpense', deleteExpenseSchema);
registry.register('VerifyPremiumOrder', verifyPremiumOrderSchema);

// Register Security Scheme
registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
});

