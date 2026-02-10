import express from "express";
import {
  getUserHistory,
  getBookHistory,
} from "../controllers/historyController.js";

import { protect, restrictTo } from "./../middleware/auth.js";

const Router = express.Router();


// authenticated routes 

Router.get("/users/:id", protect, getUserHistory);

// admin only routes 

Router.get("/books/:id", protect, restrictTo, getBookHistory);

export default Router;