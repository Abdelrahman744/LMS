import express from "express";
import * as booksController from "./../controllers/booksController.js";
// You usually need 'protect' before 'restrictTo' to verify the user is logged in
import { protect, restrictTo } from "./../middleware/auth.js"; 

const Router = express.Router();

// ============================================================
// 1. STATIC ROUTES (Must come BEFORE /:id)
// ============================================================

// Public Routes
Router.route("/").get(booksController.getBooks);
Router.route("/search").get(booksController.searchBook); // Fixed typo: serach -> search
Router.route("/filter").get(booksController.filterBook);

// Export Routes (Specific paths)
// These MUST be above /:id, or Express will think "export" is an ID
Router.route("/export/books").get(
  protect, 
  restrictTo("admin"), 
  booksController.exportBooks
);

Router.route("/export/history").get(
  protect, 
  restrictTo("admin"), 
  booksController.exportHistory
);

// Admin Create Route
Router.post("/", protect, restrictTo("admin"), booksController.addBook);

// ============================================================
// 2. DYNAMIC ROUTES (/:id catches everything else)
// ============================================================

Router.route("/:id")
  .get(booksController.getBook) // Public read
  .patch(protect, restrictTo("admin"), booksController.editBook)
  .delete(protect, restrictTo("admin"), booksController.deleteBook);

// Borrow actions
// Based on our previous work, this was 'returnBook'
Router.post(
  "/:id/return",
  protect,
  restrictTo("admin", "member"),
  booksController.returnBook 
);


Router.post(
  "/:id/borrow",
  protect,
  restrictTo("member"),
  booksController.returnBook
);

export default Router;
