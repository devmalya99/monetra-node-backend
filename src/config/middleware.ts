import helmet from "helmet";
import morgan from "morgan";
import { logger } from "../utils/logger";

/**
 * Configure Helmet for secure HTTP headers
 */
export const configureSecurityHeaders = () => {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://api.razorpay.com", "https://sdk.cashfree.com"],
            },
        },
        xssFilter: true,
        noSniff: true,
        hidePoweredBy: true,
        frameguard: { action: "deny" },
    });
};

/**
 * Configure Morgan for secure and structured logging
 */
export const configureLogger = () => {
    // In production, we use 'combined' for standard Apache-style logs
    // In development, we use 'dev' for concise, colored logs
    const format = process.env.NODE_ENV === "production" ? "combined" : "dev";

    return morgan(format, {
        skip: (req) => req.url === "/test", // Skip health check logs to reduce noise
        stream: {
            write: (message: string) => {
                // Pipe morgan output through our custom logger
                logger.info(message.trim());
            },
        },
    });
};
