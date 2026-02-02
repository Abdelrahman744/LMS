import express from "express";
import {
  getUserHistory,
  getBookHistory,
} from "../controllers/historyController.js";
// Import 'protect' here
import { protect, restrictTo } from "./../middleware/auth.js";

const Router = express.Router();

Router.get("/users/:id", protect, getUserHistory);

Router.get("/books/:id", protect, restrictTo("admin"), getBookHistory);

export default Router;