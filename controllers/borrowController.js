import express from "express";
const router = express.Router();
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
import Book from "../models/booksModel.js";
import Borrow from "../models/borrowModel.js";



const borrowBook = async (req, res) => {
  try {
    // 1. Find the book first (Don't update yet!)
    const book = await Book.findById(req.params.id);

    // 2. Check if book exists
    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found in database",
      });
    }

    // 3. Check if the book is actually available
    if (!book.available) {
      return res.status(400).json({
        status: "fail",
        message: "This book is currently unavailable (already borrowed).",
      });
    }

    // 4. Update the Book status to unavailable
    book.available = false;
    await book.save();

    // 5. Create the Borrow Record
    // matches your new Borrow Schema structure
    const newBorrow = await Borrow.create({
      userId: req.body.userId,     // Expects a User ObjectId
      bookId: book._id,            // Link to the Book ObjectId
      // borrowDate: defaults to Date.now() in your schema, so we can skip it or pass it explicitly
      dueDate: req.body.dueDate,   // Required: Expects a Date string (YYYY-MM-DD) or Date object
      returned: false              // Defaults to false
    });

    res.status(201).json({
      status: "success",
      message: "Book borrowed successfully!",
      data: { borrow: newBorrow },
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export { borrowBook };