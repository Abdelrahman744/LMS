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
Router.route("/forgotPassword").post(usersController.forgotPassword);
Router.route("/resetPassword/:token").patch(usersController.resetPassword);
Router.route("/updateMyPassword").patch(protect, usersController.updatePassword);
Router.route("/updateMe").patch(protect, usersController.updateMe);
Router.route("/deleteMe").delete(protect, usersController.deleteMe);
Router.route("/activateMe").patch(protect, usersController.activateMe);




// ==========================================
// 2. Protected Routes (Must be logged in)
// ==========================================

// Get All Users: Only Admins should see the full list
Router.route("/")
  .get(usersController.getAllUsers);

export default Router;
 