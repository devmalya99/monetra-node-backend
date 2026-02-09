import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";
import routes from "./routes"; // Imports from index.ts
import { errorHandler } from "./middlewares/error.middleware";
import { AppError } from "./utils/AppError";

const app = express();

// 1) Global Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(cors()); // Enable CORS

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev")); // Logging
}

app.use(express.json({ limit: "10kb" })); // Body parser
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 2) Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// 3) Routes
app.use("/", routes);

// 4) Unhandled Routes
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 5) Global Error Handler
app.use(errorHandler);

export default app;
