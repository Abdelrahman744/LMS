import express from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import bookRouter from "./routes/booksRoutes.js";
import usersRouter from "./routes/usersRoutes.js";
import borrowRouter from "./routes/borrowRoutes.js";
import historyRouter from "./routes/historyRoutes.js";

import AppError from "./utils/appError.js";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";







// Initialize Express app

export const app = express();

// Set security HTTP headers
app.use(helmet());

// Development logging

app.use(express.json());
app.use(morgan("dev"));



// prevent parameter pollution

app.use(hpp({
  whitelist: [
    'category',
    'author',
    'title',
  ]
}));



app.use(compression());

app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();

  const timeout = 10000;
  const start = Date.now();
  while (mongoose.connection.readyState !== 1 && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: "error",
      message: "Database connection not ready. Please try again shortly.",
    });
  }
  next();
});


app.use("/api/users", usersRouter);
app.use("/api/books", bookRouter);
app.use("/api/borrow", borrowRouter);
app.use("/api/history", historyRouter);



// Handle unhandled routes

app.all('/*splat', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});


// Global error handling middleware

app.use((err, req, res, next) => {


  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: err.status,
    message: err.message
  });
}
);







export default app;
