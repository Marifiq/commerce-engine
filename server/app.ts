import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import hpp from "hpp";

import rateLimit from "express-rate-limit";
import cors from "cors";

import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import cartRouter from "./routes/cartRouter.js";
import orderRouter from "./routes/orderRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import globalErrorHandler from "./controllers/errorController.js";
import AppError from "./utils/appError.js";


const app = express();

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin *

// Set security HTTP headers

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Prevent parameter pollution

app.use(
  hpp({
    whitelist: [
      "price",
      "category",
      "section",
      "stock",
      "rating",
    ],
  })
);

// Serving static files
app.use(express.static("public"));

// Test middleware
app.use((req, res, next) => {
  (req as any).requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/reviews", reviewRouter);


// Handle undefined routes
app.all("*path", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});



app.use(globalErrorHandler);

export default app;

