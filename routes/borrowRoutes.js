import express from "express";
import { borrowBook } from "./../controllers/borrowController.js";
import { protect, restrictTo } from "./../middleware/auth.js"; 

const Router = express.Router();

// member routes 

Router.route("/:id").post(protect, restrictTo("member"), borrowBook);

export default Router;