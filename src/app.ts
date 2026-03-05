import express from "express";
import cors from "cors";
import { configureSecurityHeaders, configureLogger } from "./config/middleware";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";
import routes from "./routes"; // Imports from index.ts
import { errorHandler } from "./middlewares/error.middleware";
import { AppError } from "./utils/AppError";

const app = express();

// 1) Global Middlewares
app.use(configureSecurityHeaders()); // Set secure security HTTP headers
app.use(configureLogger()); // Set secure and structured logging

app.use(cors({
    origin: true, // Dynamically mirror the request origin to bypass strict matching issues
    credentials: true,
}));

app.use(express.json({
    limit: "10kb",
    verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
    }
})); // Body parser
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 2) Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// 3) Routes
app.use("/", routes);

// 4) Unhandled Routes
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.method} ${req.originalUrl} on this server!`, 404));
});

// 5) Global Error Handler
app.use(errorHandler);

export default app;
