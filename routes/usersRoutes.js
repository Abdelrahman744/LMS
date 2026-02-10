import express from "express";
import * as usersController from "./../controllers/usersController.js";
// Import the security middleware
import { protect, restrictTo } from "./../middleware/auth.js"; 

const Router = express.Router();

// public routes 

Router.route("/register").post(usersController.signUp);
Router.route("/login").post(usersController.signIn);
Router.route("/forgotPassword").post(usersController.forgotPassword);
Router.route("/resetPassword/:token").patch(usersController.resetPassword);

// authenticated routes 

Router.route("/updateMyPassword").patch(protect, usersController.updatePassword);
Router.route("/updateMe").patch(protect, usersController.updateMe);
Router.route("/deleteMe").delete(protect, usersController.deleteMe);
Router.route("/activateMe").patch(protect, usersController.activateMe);



// admin only

Router.route("/").get(protect,restrictTo,usersController.getAllUsers);

export default Router;
 