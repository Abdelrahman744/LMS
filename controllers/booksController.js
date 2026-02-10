

import Borrow from "../models/borrowModel.js";
import User from "../models/usersModel.js";
import Book from "../models/booksModel.js";
import AppError from "../utils/appError.js";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);





// Done
const getBooks = async (req, res) => {
  try {
    // 1. Fetch all books
    const books = await Book.find().select('-__v');

    // 2. Send Response
    res.status(200).json({
      status: "success",
      results: books.length,
      data: { books },
    });

  } catch (error) {
    // 3. Handle Server Errors
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve books from database",
    });
  }
};

// Done
const getBook = async (req, res) => {
  try {
    // Find the book
    const book = await Book.findById(req.params.id).select('-__v');

    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: { book },
    });

  } catch (error) {
    if (error.name === 'CastError') {
       return res.status(400).json({
         status: "fail",
         message: "Invalid ID format",
       });
    }

    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
};

// Done
const addBook = async (req, res) => {
  try {
    //  Create the book
    const newBook = await Book.create(req.body);

    res.status(201).json({
      status: "success",
      data: { book: newBook },
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        status: "fail",
        message: "A book with this ISBN already exists",
      });
    }

    // Handle Validation Errors 
    res.status(400).json({
      status: "fail",
      message: error.message, 
    });
  }
};
// Done
const editBook = async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } 
    );

    // Check if ID was valid format but document didn't exist

    if (!updatedBook) {
      return res.status(404).json({ 
        status: "fail", 
        message: "Book not found" 
      });
    }

    res.status(200).json({
      status: "success",
      data: { book: updatedBook },
    });

  } catch (error) {
    //  Handle Duplicate ISBN 
    if (error.code === 11000) {
        return res.status(409).json({
            status: 'fail',
            message: 'A book with this ISBN already exists'
        });
    }

    //  Handle Invalid ID format 
    if (error.name === 'CastError') {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid Book ID format'
        });
    }

    // Handle Validation Errors 
    res.status(400).json({
      status: "fail",
      message: error.message, 
    });
  }
};

// Done
const deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;

    // 1. Delete the book
    const deletedBook = await Book.findByIdAndDelete(bookId);

    // 2. Check if book existed
    if (!deletedBook) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    // 3. Delete all borrow records for this book
    await Borrow.deleteMany({ bookId: bookId });

    res.status(200).json({
      status: "success",
      message: "Book and its history deleted successfully",
    });

  } catch (error) {
    // 4. Handle Invalid ID format
    if (error.name === 'CastError') {
       return res.status(400).json({
         status: "fail",
         message: "Invalid Book ID format",
       });
    }

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Done 



const returnBook = async (req, res, next) => {
  try {
    const bookId = req.params.id; 

    // 1. Find the Book
    const book = await Book.findById(bookId);
    if (!book) {
      return next(new AppError("Book not found", 404));
    }

    // 2. Find the Active Borrow Record for THIS Book
    const borrowRecord = await Borrow.findOne({ 
        bookId: book._id, 
        returned: false 
    });

    if (!borrowRecord) {
       return next(new AppError("This book is not currently borrowed.", 400));
    }

    // 3. SECURITY CHECK: Who is trying to return it?
  
    if (req.user.role !== 'admin' && borrowRecord.userId.toString() !== req.user.id) {
        return next(new AppError("You do not have permission to return this book.", 403));
    }

    // 4. Update the Borrow Record (Mark as returned)
    borrowRecord.returned = true;
    borrowRecord.returnDate = Date.now();
    await borrowRecord.save();

    // 5. Update the Book
    book.stock += 1;   
    book.available = true; 
    await book.save();

    // 6. Send Response
    res.status(200).json({
      status: "success",
      message: "Book returned successfully!",
      data: {
        book: { 
            id: book._id, 
            title: book.title, 
            available: book.available,
            stock: book.stock 
        },
        returnedOn: borrowRecord.returnDate
      }
    });

  } catch (error) {
    next(error);
  }
};

// Done

const searchBook = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    // Validate Input
    if (!q) {
      return res.status(400).json({ message: "Query 'q' is required" });
    }

    
   
    const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    //  Create Regex
    const searchRegex = new RegExp(safeQuery, 'i');

    // Search with $or (Title OR Author)
    const results = await Book.find({
      $or: [
        { title: searchRegex },
        { author: searchRegex },
        { category: searchRegex }, 
        { isbn: searchRegex }      
      ]
    }).select('-__v'); 

    res.status(200).json({
      status: "success",
      results: results.length,
      data: { books: results },
    });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Done
const filterBook = async (req, res) => {
  try {
    const category = req.query.category?.trim();
    
    //  Validate Input
    if (!category) {
      return res.status(400).json({ message: "Query 'category' is required" });
    }

    
    const safeCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     

  
    //  Find Books
    const results = await Book.find({
      category: new RegExp(`^${safeCategory}$`, 'i') 
    }).select('-__v');

    res.status(200).json({
      status: "success",
      results: results.length,
      data: { books: results }, 
    });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
// Done
const exportBooks = async (req, res) => {
  try {
    const userId = req.query.userId; 

    // 1. Check if user exists 
    
    if (!userId || userId.length !== 24) {
         return res.status(400).json({ status: "fail", message: "Invalid Admin ID" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(403).json({ status: "fail", message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ status: "fail", message: "Only admins can export data" });
    }

    // 2. Fetch all books
    const books = await Book.find().select('-__v').lean(); 

    // 3. Define Helper for CSV Safety

    const escapeCsv = (text) => {
        if (!text) return "";
        return `"${text.toString().replace(/"/g, '""')}"`; 
    };

    // 4. Generate CSV Header and Rows
    const headers = "ID,Title,Author,Category,ISBN,Available,Stock";
    const rows = books.map((b) => {
      return [
        b._id,
        escapeCsv(b.title),
        escapeCsv(b.author),
        escapeCsv(b.category),
        escapeCsv(b.isbn),
        b.available,
        b.stock || 0
      ].join(",");
    });

    const csvContent = [headers, ...rows].join("\n");

    // 5. Send Response
    res.header("Content-Type", "text/csv");
    res.attachment("books_export.csv");
    return res.status(200).send(csvContent);

  } catch (err) {
  
    return res.status(500).json({ status: "error", message: "Export failed" });
  }
};

const exportHistory = async (req, res) => {
  try {
    const userId = req.query.userId; 

    // 1. Validation 
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ status: "fail", message: "Invalid Admin ID" });
    }

    // 2. Admin Check using Mongoose ID
    const user = await User.findById(userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ 
        status: "fail", 
        message: "Access denied: Admins only" 
      });
    }

    // 3. Fetch History AND Populate Names/Titles
  
    const borrows = await Borrow.find()
      .populate('userId', 'name email')  
      .populate('bookId', 'title')      
      .lean(); 

    // 4. Helper for Date Formatting 
    const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : "";

    // 5. Generate Readable CSV
    const csvRows = borrows.map(b => {
      
      const userName = b.userId ? b.userId.name : "Deleted User";
      const userEmail = b.userId ? b.userId.email : "N/A";
      const bookTitle = b.bookId ? b.bookId.title : "Deleted Book";
      
    
      const safeTitle = `"${bookTitle.replace(/"/g, '""')}"`;
      const safeName = `"${userName.replace(/"/g, '""')}"`;

      return [
        b._id,
        safeTitle,     
        safeName,      
        userEmail,
        formatDate(b.borrowDate),
        formatDate(b.dueDate),
        b.returned ? "Yes" : "No",
        formatDate(b.returnDate)
      ].join(",");
    });

    // Add Header Row
    const headers = "BorrowID,Book Title,User Name,User Email,Borrowed On,Due Date,Returned,Returned On";
    const csvContent = [headers, ...csvRows].join("\n");

    // 6. Send File
    res.header("Content-Type", "text/csv");
    res.attachment("borrow_history.csv");
    res.status(200).send(csvContent);

  } catch (error) {
    
    res.status(500).json({
      status: "error",
      message: "Failed to export history",
    });
  }
};

export {
  getBooks,
  getBook,
  addBook,
  editBook,
  deleteBook,
  returnBook,
  searchBook,
  filterBook,
  exportBooks,
  exportHistory,
};
