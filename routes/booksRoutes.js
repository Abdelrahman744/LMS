import express from "express";
import * as booksController from "./../controllers/booksController.js";
import { protect, restrictTo } from "./../middleware/auth.js"; 

const Router = express.Router();


// Public Routes
Router.route("/").get(protect, booksController.getBooks);
Router.route("/:id").get(booksController.getBook)
Router.route("/search").get(booksController.searchBook); 
Router.route("/filter").get(booksController.filterBook);



// admin routes

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


Router.post("/", protect, restrictTo("admin"), booksController.addBook);


Router.route("/:id")
  .patch(protect, restrictTo("admin"), booksController.editBook)
  .delete(protect, restrictTo("admin"), booksController.deleteBook);



  // authenticated routes 
  

Router.post( "/:id/return",protect, booksController.returnBook );


export default Router;
