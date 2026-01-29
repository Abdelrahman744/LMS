import express from "express";
import * as booksController from "./../controllers/booksController.js";
import { restrictTo } from "./../middleware/auth.js";
const Router = express.Router();

// users can

Router.route("/").get(booksController.getBooks);
Router.route("/search").get(booksController.serachBook);
Router.route("/filter").get(booksController.filterBook);
Router.get("/:id", booksController.getBook);

// both can

Router.post(
  "/:id/return",
  restrictTo("admin", "member"),
  booksController.bookStatus
);

// admin can

Router.post("/", restrictTo("admin"), booksController.addBook);

Router.route("/export/books").get(booksController.exportBooks);
Router.route("/export/history").get(booksController.exportHistory);

Router.route("/:id")
  .patch(restrictTo("admin"), booksController.editBook)
  .delete(restrictTo("admin"), booksController.deleteBook);

export default Router;
