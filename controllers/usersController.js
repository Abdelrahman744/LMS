import express from "express";
const router = express.Router();
import User from "../models/usersModel.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/email.js";
import crypto from "crypto";



import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};


const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production' // Only send cookie over HTTPS in production
  };
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined; // Remove password from output
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });

};




const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    
    if (!name || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Name, email, and password are required",
      });
    }

  
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        status: "fail",
        message: "Name must be between 2 and 50 characters",
      });
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email format",
      });
    }

    if (password.length < 6 || password.length > 100) {
      return res.status(400).json({
        status: "fail",
        message: "Password must be between 6 and 100 characters",
      });
    }

  
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      return res.status(409).json({
        status: "fail",
        message: "This email is already registered",
      });
    }

  
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, 
      role: "member",    
    });


  
    const userResponse = newUser.toObject();
    delete userResponse.password;

    createSendToken(newUser, 201, res);

  } catch (error) {
    
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};



const signIn = async (req, res) => {
  try {
    const { email: loginInput, password } = req.body;

    // 1. Check if fields exist
    if (!loginInput || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Username/Email and password are required",
      });
    }

    // 2. Find User
    const user = await User.findOne({
      $or: [
        { email: loginInput.toLowerCase().trim() },
        { name: loginInput.trim() } 
      ]
    }).select('+password');

    // 3. Verify User AND Password

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password"
      });
    } 

     
 
    createSendToken(user, 200, res);

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


const getAllUsers = async (req, res) => {
  try {

    const users = await User.find().select('-password'); // Exclude passwords
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users
      }
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    }); 

  }
};



const forgotPassword = async (req, res,next) => {
  try{
    const user = await User.findOne({email: req.body.email.trim().toLowerCase()});
    if(!user){
      return next(new Error("No user with that email"), 404);
    }
    
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false })
     
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.
    \nIf you didn't forget your password, please ignore this email!`;

    try{
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 minutes)',
        message
      });
      
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
    }catch(err){
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      const error = new Error("No user with that email");
      error.statusCode = 404;
      return next(error);
    }


  }catch(err){
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }

}

const resetPassword = async (req, res,next) => {
  try{
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await
      User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

    if(!user){
      return next(new Error("Token is invalid or has expired"), 400);
    }


    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();


    createSendToken(user, 200, res);

  }catch(err){
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
}

const updatePassword = async (req, res,next) => {
  
  try{
    const user = await User.findById(req.user.id).select('+password');
    if(!user){
      return next(new Error("User not found"), 404);
    }

    if(!(await user.correctPassword(req.body.currentPassword, user.password))){
      return next(new Error("Your current password is wrong"), 401);
    }


    user.password = req.body.newPassword;
    await user.save();

    createSendToken(user, 200, res);


  }catch(err){
    res.status(500).json({
      status: "error",
      message: err.message,
    });

  }

}

const updateMe = async (req, res,next) => {
  try{
    const user = await User.findById(req.user.id);
    if(!user){
      return next(new Error("User not found"), 404);
    }

    const { name, email } = req.body;
    if(name){
      if(name.trim().length < 2 || name.trim().length > 50){
        return res.status(400).json({
          status: "fail",
          message: "Name must be between 2 and 50 characters"
        });
      }
      user.name = name.trim();
    }


    if(email){
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailRegex.test(email)){
        return res.status(400).json({
          status: "fail",
          message: "Invalid email format"
        
        });
      }

      const existingUser = await User
        .findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if(existingUser){
        return res.status(409).json({
          status: "fail",
          message: "This email is already in use by another account"
        });
      }
      user.email = email.toLowerCase().trim();
    }

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  }catch(err){
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }


}



const deleteMe = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { active: false });

    if (!user) {
      return next(new Error("User not found"), 404);
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    next(err); 
  }
};



const activateMe = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { active: true });

    if (!user) {
      return next(new Error("User not found"), 404);
    }

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: true
        }
      }

    });
  } catch (err) {
    next(err); 
  }
}

export { signUp, signIn, getAllUsers , forgotPassword, resetPassword,updatePassword, updateMe, deleteMe,activateMe};