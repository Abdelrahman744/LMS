import express from "express";
const router = express.Router();
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { books, borrowSheet } from "./booksController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BOOKS_PATH = `${__dirname}/../dev-data/books.json`;
const BORROWS_PATH = `${__dirname}/../dev-data/borrow.json`;

const borrowBook = (req, res) => {
  const { id: userId } = req.body;
  const bookId = Number(req.params.id);

  // Validate Book ID
  if (isNaN(bookId) || bookId <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid book ID. Must be a positive number",
    });
  }

  // Validate User ID
  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required",
    });
  }

  if (typeof userId !== "number" || userId <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "User ID must be a positive number",
    });
  }

  // Check if book exists
  const book = books.find((b) => b.id === bookId);
  if (!book) {
    return res.status(404).json({
      status: "fail",
      message: "Book not found",
    });
  }

  // Check if book is available
  if (!book.available) {
    return res.status(400).json({
      status: "fail",
      message: "Book is already borrowed",
    });
  }
  const userActiveBorrows = borrowSheet.filter(
    (b) => b.userId === userId && !b.returned
  );

  const MAX_BORROWS = 5;
  if (userActiveBorrows.length >= MAX_BORROWS) {
    return res.status(400).json({
      status: "fail",
      message: `Cannot borrow more than ${MAX_BORROWS} books at once`,
    });
  }

  const alreadyBorrowed = userActiveBorrows.find((b) => b.bookId === bookId);
  if (alreadyBorrowed) {
    return res.status(400).json({
      status: "fail",
      message: "You have already borrowed this book",
    });
  }
  const today = new Date();

  const localDate = today.toLocaleDateString("en-CA");

  // Update book availability and borrow details
  book.available = false;
  book.borrowedBy = userId;
  book.borrowedAt = localDate;
  book.dueDate = new Date(
    today.getTime() + 7 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-CA");

  // Create borrow record
  const newBorrow = {
    id: borrowSheet.length ? borrowSheet[borrowSheet.length - 1].id + 1 : 1,
    bookId,
    userId,
    borrowDate: book.borrowedAt,
    dueDate: book.dueDate,
    returned: false,
  };

  borrowSheet.push(newBorrow);

  // Save to files
  fs.writeFile(BOOKS_PATH, JSON.stringify(books, null, 2), (err) => {
    if (err) {
      console.error("Books save failed:", err);
      // Rollback
      book.available = true;
      borrowSheet.pop();
      return res.status(500).json({
        status: "error",
        message: "Failed to update book availability",
      });
    }

    fs.writeFile(BORROWS_PATH, JSON.stringify(borrowSheet, null, 2), (err) => {
      if (err) {
        console.error("Borrows save failed:", err);
        // Rollback both
        book.available = true;
        borrowSheet.pop();
        fs.writeFileSync(BOOKS_PATH, JSON.stringify(books, null, 2));

        return res.status(500).json({
          status: "error",
          message: "Failed to save borrow record",
        });
      }

      res.status(201).json({
        status: "success",
        message: "Book borrowed successfully!",
        data: { borrow: newBorrow },
      });
    });
  });
};
export { borrowBook };
