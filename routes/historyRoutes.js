import express from "express";
import {
  getUserHistory,
  getBookHistory,
} from "../controllers/historyController.js";
import { restrictTo } from "./../middleware/auth.js";

const Router = express.Router();

Router.get("/users/:id", getUserHistory);

Router.get("/books/:id", restrictTo("admin"), getBookHistory);

export default Router;
