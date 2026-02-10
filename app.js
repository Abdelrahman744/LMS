import express from "express";
import morgan from "morgan";
import bookRouter from "./routes/booksRoutes.js";
import usersRouter from "./routes/usersRoutes.js";
import borrowRouter from "./routes/borrowRoutes.js";
import historyRouter from "./routes/historyRoutes.js";


import AppError from "./utils/appError.js";
import rateLimit from "express-rate-limit";
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

// Limit requests from the same IP

app.use("/api",rateLimit({
  max: 100, 
  windowMs: 60 * 60 * 1000, 
  message: "Too many requests from this IP, please try again in an hour!"
}));

// prevent parameter pollution

app.use(hpp({
  whitelist: [
    'category',
    'author',
    'title',
     
  ]
}));


app.use(compression());


// Routes

app.use("/api/users", usersRouter); // User routes
app.use("/api/books", bookRouter); // Book routes
app.use("/api/borrow", borrowRouter); // Borrow routes
app.use("/api/history", historyRouter); // History routes



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
