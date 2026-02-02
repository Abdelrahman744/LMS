import express from "express";
const router = express.Router();
import User from "../models/usersModel.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Manual Validation (Keep this! It's good to fail fast before hitting the DB)
    if (!name || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Name, email, and password are required",
      });
    }

    // Name Validation
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        status: "fail",
        message: "Name must be between 2 and 50 characters",
      });
    }

    // Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email format",
      });
    }

    // Password Validation
    if (password.length < 6 || password.length > 100) {
      return res.status(400).json({
        status: "fail",
        message: "Password must be between 6 and 100 characters",
      });
    }

    // 2. Check for Duplicate Email (Database Query)
    // We use findOne instead of looping through an array
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      return res.status(409).json({
        status: "fail",
        message: "This email is already registered",
      });
    }

    // 3. Create the User
    // Note: We are letting MongoDB generate the unique '_id' automatically.
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // ⚠️ See Security Note below
      role: "member",     // Default role
    });

    // 4. Sanitize the Response (Remove password)
    // Mongoose documents need .toObject() to become regular JS objects for destructuring
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: { user: userResponse },
    });

  } catch (error) {
    // Handle Mongoose Validation Errors (fallback)
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

    // 2. Find User (Check BOTH Email AND Name)
    // We use $or to search for a user where EITHER condition matches
    const user = await User.findOne({
      $or: [
        { email: loginInput.toLowerCase().trim() },
        { name: loginInput.trim() } // Names might be case-sensitive depending on your needs
      ]
    }).select('+password');

    // 3. Verify User exists AND Password matches
    // Note: In a real app, use bcrypt.compare(password, user.password) here
   if (!user || user.password !== password) {
   return res.status(401).json({ status: "fail", message: "Invalid credentials" });
}

    // 4. Success Response
    res.status(200).json({
      status: "success",
      message: `Welcome ${user.name}!`,
      data: {
        id: user._id, // Mongoose uses _id
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};



const getAllUsers = async (req, res) => {
  try {
    // 1. Fetch users from DB
    // .select('-password') tells Mongo: "Give me everything EXCEPT the password field"
    const users = await User.find().select('-password');

    res.status(200).json({
      status: "success",
      results: users.length,
      data: users, // Passwords are already gone!
    });

  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      status: "error",
      message: "Error fetching users",
    });
  }
};



export { signUp, signIn, getAllUsers };
