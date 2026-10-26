import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import apiRouter from "./routes";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { errorHandler } from "./middlewares/errorHandler";

const app: Application = express();

// 1. Security Headers (Clickjacking & MIME-sniffing defense)
app.use(
  helmet({
    frameguard: { action: "deny" },
  })
);

// 2. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// 3. HTTP Request Logging
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
}

// 4. Request Body & Cookie Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// 5. Root API Welcome Route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Smart Hostel & Mess Management System API",
    version: "1.0.0",
    docs: "/api/v1/health",
  });
});

// 6. Mount API v1 Routes
app.use(env.API_PREFIX, apiRouter);

// 7. Unmatched Route Handler (404)
app.use(notFoundHandler);

// 8. Centralized Operational Error Handler
app.use(errorHandler);

export default app;
