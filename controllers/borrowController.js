import express from "express";
const router = express.Router();
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
import Book from "../models/booksModel.js";
import Borrow from "../models/borrowModel.js";
import AppError from "../utils/appError.js"; 


const borrowBook = async (req, res) => {
  try {
  
    const userId = req.user._id; 
    
   
    const { dueDate } = req.body;

    
    if (!dueDate) {
         return res.status(400).json({ status: "fail", message: "Please provide a dueDate" });
    }

   
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ status: "fail", message: "Book not found" });
    }

    if (!book.available) {
      return res.status(400).json({ status: "fail", message: "Book is not available" });
    }

  
if (book.stock < 1) {
  return res.status(400).json({ 
    status: "fail", 
    message: "This book is currently out of stock." 
  });
}


book.stock = book.stock - 1;


if (book.stock === 0) {
  book.available = false;
} else {
 
  book.available = true; 
}


await book.save();

    const newBorrow = await Borrow.create({
      userId: userId,       
      bookId: book._id,
      dueDate: dueDate,     
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