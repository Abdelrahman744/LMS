import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BOOKS_PATH = `${__dirname}/../dev-data/books.json`;
const BORROWS_PATH = `${__dirname}/../dev-data/borrow.json`;
let borrowSheet = JSON.parse(fs.readFileSync(BORROWS_PATH));
let books = JSON.parse(fs.readFileSync(BOOKS_PATH));

// GET ALL
const getBooks = (req, res) => {
  res.status(200).json({
    status: "success",
    results: books.length,
    data: { books },
  });
};

// GET ONE
const getBook = (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid book ID. Must be a positive number",
    });
  }
  const book = books.find((el) => el.id === id);

  if (!book) {
    return res.status(404).json({
      status: "fail",
      message: "book not found",
    });
  }
  res.status(200).json({
    status: "success",
    data: { book },
  });
};

const addBook = (req, res) => {
  // Validation
  const { title, author, category, isbn, available } = req.body;

  if (!title || !author || !category || !isbn) {
    return res.status(400).json({
      status: "fail",
      message: "Title, author,ispn, and category are required",
    });
  }

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      status: "fail",
      message: "Title must be a non-empty string",
    });
  }

  if (typeof author !== "string" || author.trim() === "") {
    return res.status(400).json({
      status: "fail",
      message: "Author must be a non-empty string",
    });
  }
  if (isbn !== undefined) {
    if (
      typeof isbn !== "string" ||
      !/^\d{10}$|^\d{13}$/.test(isbn.replace(/-/g, ""))
    ) {
      return res.status(400).json({
        status: "fail",
        message: "ISBN must be 10 or 13 digits (dashes allowed)",
      });
    }
  }

  // Check for duplicate
  const duplicate = books.find(
    (b) => b.title.toLowerCase() === title.trim().toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({
      status: "fail",
      message: "A book with this title already exists",
    });
  }

  const newId = books.length > 0 ? books[books.length - 1].id + 1 : 1;
  const newBook = {
    id: newId,
    title: title.trim(),
    author: author.trim(),
    isbn: isbn.trim(),
    category: category.trim(),
    available: available !== undefined ? Boolean(available) : true,
  };

  books.push(newBook);
  fs.writeFile(BOOKS_PATH, JSON.stringify(books, null, 2), (err) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Failed to save book",
      });
    }
    res.status(201).json({
      status: "success",
      data: { book: newBook },
    });
  });
};

const editBook = (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid book ID",
    });
  }

  const book = books.find((b) => b.id === id);
  if (!book) {
    return res.status(404).json({
      status: "fail",
      message: "Book not found",
    });
  }

  const { title, author, category, available } = req.body;

  if (!title && !author && !category && available === undefined) {
    return res.status(400).json({
      status: "fail",
      message: "At least one field must be provided for update",
    });
  }

  // Validate each field

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        status: "fail",
        message: "Title must be a non-empty string",
      });
    }
    book.title = title.trim();
  }

  if (author !== undefined) {
    if (typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({
        status: "fail",
        message: "Author must be a non-empty string",
      });
    }
    book.author = author.trim();
  }

  if (category !== undefined) {
    if (typeof category !== "string" || category.trim() === "") {
      return res.status(400).json({
        status: "fail",
        message: "Category must be a non-empty string",
      });
    }
    book.category = category.trim();
  }

  if (available !== undefined) {
    book.available = Boolean(available);
  }

  fs.writeFile(BOOKS_PATH, JSON.stringify(books, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ status: "error", message: "Save failed" });
    }
    res.json({ status: "success", data: { book } });
  });
};

// DELETE BOOK
const deleteBook = (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid book ID. Must be a positive number",
    });
  }
  const bookIndex = books.findIndex((b) => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({
      status: "fail",
      message: "Book not found",
    });
  }

  books.splice(bookIndex, 1);

  fs.writeFile(BOOKS_PATH, JSON.stringify(books, null, 2), (err) => {
    if (err) {
      console.error("Delete save failed:", err);
      return res.status(500).json({ message: "Save failed" });
    }
    res.status(204).send();
  });
};

// RETURN BOOK
const bookStatus = (req, res) => {
  const bookId = Number(req.params.id);
  if (isNaN(bookId) || bookId <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid book ID. Must be a positive number",
    });
  }
  const book = books.find((b) => b.id === bookId);
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (book.available)
    return res.status(400).json({ message: "Already available" });

  book.available = true;
  book.borrowedBy = null;
  book.borrowedAt = null;
  book.dueDate = null;

  const borrowRecord = borrowSheet.find(
    (b) => b.bookId === bookId && !b.returned
  );
  if (borrowRecord) {
    borrowRecord.returned = true;
    borrowRecord.returnDate = new Date().toLocaleDateString("en-CA");
  }

  // Save books
  fs.writeFile(BOOKS_PATH, JSON.stringify(books, null, 2), (err) => {
    if (err) console.error("Books save failed:", err);
  });

  // Save borrows + respond
  fs.writeFile(BORROWS_PATH, JSON.stringify(borrowSheet, null, 2), (err) => {
    if (err) {
      console.error("Borrows save failed:", err);
      return res.status(500).json({ message: "Save failed" });
    }
    res.json({
      message: "Book returned! Thank you",
      book: { id: book.id, title: book.title, available: true },
      returnedOn: borrowRecord?.returnDate,
    });
  });
};

const serachBook = (req, res) => {
  const q = req.query.q?.toLowerCase().trim();
  if (!q) {
    return res.status(400).json({ message: "Query 'q' is required" });
  }
  const results = books.filter(
    (book) =>
      book.title?.toLowerCase().includes(q) ||
      book.author?.toLowerCase().includes(q)
  );

  res.status(200).json({
    status: "success",
    results: results.length,
    data: results,
  });
};

const filterBook = (req, res) => {
  const category = req.query.category?.toLowerCase().trim();
  if (!category) {
    return res.status(400).json({ message: "Query 'category' is required" });
  }

  const results = books.filter(
    (book) => book.category?.toLowerCase() === category
  );

  res.status(200).json({
    status: "success",
    results: results.length,
    data: results,
  });
};

const exportBooks = (req, res) => {
  console.log("Export Books - Full query:", req.query);
  console.log("Export Books - userId:", req.query.userId);

  const userId = Number(req.query.userId);

  console.log("Export Books - userId as number:", userId);
  console.log("Export Books - isNaN check:", isNaN(userId));

  if (!userId || isNaN(userId)) {
    console.log("Export Books - REJECTED: Invalid userId");
    return res.status(401).json({
      status: "fail",
      message: "User ID is required and must be a valid number",
    });
  }

  const USERS_PATH = `${__dirname}/../dev-data/users.json`;
  const users = JSON.parse(fs.readFileSync(USERS_PATH));
  const user = users.find((u) => u.id === userId);

  console.log("Export Books - User found:", user);

  if (!user) {
    console.log("Export Books - REJECTED: User not found");
    return res.status(403).json({
      status: "fail",
      message: "User not found",
    });
  }

  if (user.role !== "admin") {
    console.log("Export Books - REJECTED: User is not admin, role:", user.role);
    return res.status(403).json({
      status: "fail",
      message: "Only admins can export data",
    });
  }
  try {
    // Read fresh book data directly from the file
    const freshBooksData = JSON.parse(fs.readFileSync(BOOKS_PATH));

    console.log("Export Books - SUCCESS: Exporting books data");

    const csv = [
      "id,title,author,category,isbn,available",
      ...freshBooksData.map(
        (b) =>
          `${b.id},${b.title},${b.author},${b.category || ""},${b.isbn},${b.available}`
      ),
    ].join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment("books.csv");
    return res.send(csv);
  } catch (err) {
    console.error("Export Books Error:", err);
    return res.status(500).json({ status: "error", message: "Export failed" });
  }
};

const exportHistory = (req, res) => {
  console.log("Export History - Full query:", req.query);
  console.log("Export History - userId:", req.query.userId);

  const userId = Number(req.query.userId);

  console.log("Export History - userId as number:", userId);
  console.log("Export History - isNaN check:", isNaN(userId));

  if (!userId || isNaN(userId)) {
    console.log("Export History - REJECTED: Invalid userId");
    return res.status(401).json({
      status: "fail",
      message: "User ID is required and must be a valid number",
    });
  }

  const USERS_PATH = `${__dirname}/../dev-data/users.json`;
  const users = JSON.parse(fs.readFileSync(USERS_PATH));
  const user = users.find((u) => u.id === userId);

  console.log("Export History - User found:", user);

  if (!user) {
    console.log("Export History - REJECTED: User not found");
    return res.status(403).json({
      status: "fail",
      message: "User not found",
    });
  }

  if (user.role !== "admin") {
    console.log(
      "Export History - REJECTED: User is not admin, role:",
      user.role
    );
    return res.status(403).json({
      status: "fail",
      message: "Only admins can export data",
    });
  }

  console.log("Export History - SUCCESS: Exporting for admin user");

  const csv = [
    "borrowId,bookId,userId,borrowedOn,dueDate,returned,returnedOn",
    ...borrowSheet.map(
      (b) =>
        // Ensure these keys (b.borrowDate, b.dueDate, etc.) match
        // the actual property names in your borrow.json file.
        `${b.id},${b.bookId},${b.userId},${b.borrowDate || ""},${b.dueDate || ""},${b.returned},${b.returnDate || ""}`
    ),
  ].join("\n");

  res.header("Content-Type", "text/csv");
  res.attachment("history.csv");
  res.send(csv);
};

export {
  getBooks,
  getBook,
  addBook,
  editBook,
  deleteBook,
  bookStatus,
  serachBook,
  filterBook,
  exportBooks,
  exportHistory,
  books,
  borrowSheet,
};
