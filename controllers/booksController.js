

import Borrow from "../models/borrowModel.js";
import User from "../models/usersModel.js";
import Book from "../models/booksModel.js";
import AppError from "../utils/appError.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);





// Done
const getBooks = async (req, res) => {
  try {
    // 1. Fetch all books
    // .select('-__v') removes the internal Mongoose version key
    const books = await Book.find().select('-__v');

    // 2. Send Response
    res.status(200).json({
      status: "success",
      results: books.length,
      data: { books },
    });

  } catch (error) {
    // 3. Handle Server Errors
    // Use 500 (Server Error) because if this fails, the DB is down.
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve books from database",
    });
  }
};

// Done
const getBook = async (req, res) => {
  try {
    // 1. Find the book
    const book = await Book.findById(req.params.id).select('-__v');

    // 2. CRITICAL: Check if book is null (ID format was valid, but no record found)
    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    // 3. Send Success Response
    res.status(200).json({
      status: "success",
      data: { book },
    });

  } catch (error) {
    // 4. Handle Invalid IDs or Server Errors
    // If the ID is the wrong format (e.g. "123" instead of ObjectId), Mongoose throws a CastError
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
    // 1. Create the book
    // You can pass req.body directly because the Schema acts as a filter.
    // However, destructuring is safer if you want to strictly control inputs.
    const newBook = await Book.create(req.body);

    res.status(201).json({
      status: "success",
      data: { book: newBook },
    });

  } catch (error) {
    // 2. Handle Duplicate ISBN Error (Mongoose Error Code 11000)
    if (error.code === 11000) {
      return res.status(409).json({ // 409 Conflict
        status: "fail",
        message: "A book with this ISBN already exists",
      });
    }

    // 3. Handle Validation Errors (Missing Title, too short, etc.)
    res.status(400).json({
      status: "fail",
      message: error.message, // Send the specific validation error to the user
    });
  }
};
// Done
const editBook = async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // valid for new Schema
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
    // 1. Handle Duplicate ISBN (e.g., changing ISBN to one that exists)
    if (error.code === 11000) {
        return res.status(409).json({
            status: 'fail',
            message: 'A book with this ISBN already exists'
        });
    }

    // 2. Handle Invalid ID format (e.g., "123" instead of ObjectId)
    if (error.name === 'CastError') {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid Book ID format'
        });
    }

    // 3. Handle Validation Errors (e.g. invalid stock number)
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
    // This prevents "orphan" data (Borrow records pointing to a book that doesn't exist)
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
    // We need to know WHO borrowed it to check permissions
    const borrowRecord = await Borrow.findOne({ 
        bookId: book._id, 
        returned: false 
    });

    if (!borrowRecord) {
       return next(new AppError("This book is not currently borrowed.", 400));
    }

    // 3. SECURITY CHECK: Who is trying to return it?
    // - Admins can return ANY book.
    // - Members can ONLY return books they borrowed.
    if (req.user.role !== 'admin' && borrowRecord.userId.toString() !== req.user.id) {
        return next(new AppError("You do not have permission to return this book.", 403));
    }

    // 4. Update the Borrow Record (Mark as returned)
    borrowRecord.returned = true;
    borrowRecord.returnDate = Date.now();
    await borrowRecord.save();

    // 5. Update the Book (Handle Stock Logic!)
    book.stock += 1;   // <--- CRITICAL FIX: Restore the stock count
    book.available = true; // Make sure it's marked available
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
            stock: book.stock // Return new stock so frontend can update
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

    // 1. Validate Input
    if (!q) {
      return res.status(400).json({ message: "Query 'q' is required" });
    }

    // 2. ESCAPE special regex characters to prevent crashes
    // If user searches for "(Harry", this turns it into "\(Harry" so it's treated as text.
    const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 3. Create Regex
    const searchRegex = new RegExp(safeQuery, 'i');

    // 4. Search with $or (Title OR Author)
    const results = await Book.find({
      $or: [
        { title: searchRegex },
        { author: searchRegex },
        { category: searchRegex }, // Added category for better UX
        { isbn: searchRegex }      // Added ISBN for exact finding
      ]
    }).select('-__v'); // Clean output

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
    
    // 1. Validate Input
    if (!category) {
      return res.status(400).json({ message: "Query 'category' is required" });
    }

    // 2. Escape special characters (Fixes crash on "Sci-Fi" or "C++")
    const safeCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     

  
    // 3. Find Books
    // matches strictly (^...$) but ignores case ('i')
    const results = await Book.find({
      category: new RegExp(`^${safeCategory}$`, 'i') 
    }).select('-__v');

    res.status(200).json({
      status: "success",
      results: results.length,
      data: { books: results }, // Consistent formatting
    });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
// Done
const exportBooks = async (req, res) => {
  try {
    const userId = req.query.userId; 

    // 1. Check if user exists (using Mongo ID)
    // We check valid format to prevent CastErrors if a bad ID is sent
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
    // This wraps text in quotes so commas inside titles don't break the file
    const escapeCsv = (text) => {
        if (!text) return "";
        return `"${text.toString().replace(/"/g, '""')}"`; // Escape existing quotes
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
    res.attachment("books_export.csv"); // This prompts the browser download
    return res.status(200).send(csvContent);

  } catch (err) {
  
    return res.status(500).json({ status: "error", message: "Export failed" });
  }
};

const exportHistory = async (req, res) => {
  try {
    const userId = req.query.userId; 

    // 1. Validation (Must be a valid MongoDB ID string)
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
    // This replaces the ID codes with the actual objects from the other tables
    const borrows = await Borrow.find()
      .populate('userId', 'name email')  // Get User Name & Email
      .populate('bookId', 'title')       // Get Book Title
      .lean(); 

    // 4. Helper for Date Formatting (YYYY-MM-DD)
    const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : "";

    // 5. Generate Readable CSV
    const csvRows = borrows.map(b => {
      // Handle cases where User or Book might have been deleted
      const userName = b.userId ? b.userId.name : "Deleted User";
      const userEmail = b.userId ? b.userId.email : "N/A";
      const bookTitle = b.bookId ? b.bookId.title : "Deleted Book";
      
      // Escape commas in titles/names to prevent CSV errors
      const safeTitle = `"${bookTitle.replace(/"/g, '""')}"`;
      const safeName = `"${userName.replace(/"/g, '""')}"`;

      return [
        b._id,
        safeTitle,     // Actual Book Title
        safeName,      // Actual User Name
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
