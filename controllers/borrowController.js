import express from "express";
const router = express.Router();
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
import Book from "../models/booksModel.js";
import Borrow from "../models/borrowModel.js";
import AppError from "../utils/appError.js"; // Import your error class

// controllers/borrowController.js

const borrowBook = async (req, res) => {
  try {
    // 1. Get User ID from the Logged-in User (Secure)
    // The 'protect' middleware adds 'req.user' to the request
    const userId = req.user._id; 
    
    // 2. Get Due Date from Body
    const { dueDate } = req.body;

    // Check if dueDate is provided
    if (!dueDate) {
         return res.status(400).json({ status: "fail", message: "Please provide a dueDate" });
    }

    // 3. Find Book
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ status: "fail", message: "Book not found" });
    }

    if (!book.available) {
      return res.status(400).json({ status: "fail", message: "Book is not available" });
    }

  // 1. Check if we actually have stock BEFORE borrowing
if (book.stock < 1) {
  return res.status(400).json({ 
    status: "fail", 
    message: "This book is currently out of stock." 
  });
}

// 2. Decrease the Stock
book.stock = book.stock - 1;

// 3. Update Availability
// Only mark as "Unavailable" if we just gave away the LAST copy
if (book.stock === 0) {
  book.available = false;
} else {
  // If stock is 1 or more, it must be available
  book.available = true; 
}

// 4. Save the changes
await book.save();

    // 5. Create Borrow Record
    const newBorrow = await Borrow.create({
      userId: userId,        // <--- Uses the secure ID from token
      bookId: book._id,
      dueDate: dueDate,      // <--- Uses the date from Postman
      returned: false
    });

    res.status(201).json({
      status: "success",
      data: { borrow: newBorrow },
    });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export { borrowBook };