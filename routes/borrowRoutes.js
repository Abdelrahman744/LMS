import express from "express";
import { borrowBook } from "./../controllers/borrowController.js";
// Import 'protect' alongside 'restrictTo'
import { protect, restrictTo } from "./../middleware/auth.js"; 

const Router = express.Router();


Router.route("/:id").post(protect, restrictTo("member"), borrowBook);

export default Router;