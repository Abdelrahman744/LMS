import express from "express";
import * as usersController from "./../controllers/usersController.js";
// Import the security middleware
import { protect, restrictTo } from "./../middleware/auth.js"; 

const Router = express.Router();

// ==========================================
// 1. Public Routes (Anyone can access)
// ==========================================
Router.route("/register").post(usersController.signUp);
Router.route("/login").post(usersController.signIn);

// ==========================================
// 2. Protected Routes (Must be logged in)
// ==========================================

// Get All Users: Only Admins should see the full list
Router.route("/")
  .get(protect, restrictTo("admin"), usersController.getAllUsers);

export default Router;
 