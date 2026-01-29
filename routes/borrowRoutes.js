import express from "express";
import { borrowBook } from "./../controllers/borrowController.js";
import { restrictTo } from "./../middleware/auth.js";

const Router = express.Router();

// Borrow book
Router.route("/:id").post(restrictTo("member"), borrowBook);

export default Router;
