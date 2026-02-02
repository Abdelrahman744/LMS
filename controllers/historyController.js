import Book from "../models/booksModel.js";
import Borrow from "../models/borrowModel.js";
import User from "../models/usersModel.js";


const getUserHistory = async (req, res) => {
  try {
    const userId = req.params.id; // Expecting a Mongo ObjectId string

    // 1. Find all borrow records & automatically fill in the Book details
    // .populate('bookId') replaces the ID with the actual Book object
    const borrows = await Borrow.find({ userId: userId })
      .populate('bookId', 'title author') // Only get title and author (optional optimization)
      .lean(); // Converts to plain JS object

    if (!borrows.length) {
      return res.status(200).json({
        status: "success",
        results: 0,
        data: { history: [] },
      });
    }

    // 2. Format the data for the response
    const history = borrows.map((b) => {
      // Handle case where book might have been deleted from database
      const book = b.bookId || null; 

      return {
        borrowId: b._id,
        bookId: book ? book._id : null,
        title: book ? book.title : "Book No Longer Exists",
        author: book ? book.author : "Unknown",
        borrowedOn: b.borrowDate,
        dueDate: b.dueDate,
        returned: b.returned,
        returnedOn: b.returnDate,
        
        // Compare Dates directly
        overdue: b.returned 
          ? b.returnDate > b.dueDate // If returned: Was it late?
          : new Date() > b.dueDate   // If active: Is it late right now?
      };
    });

    res.status(200).json({
      status: "success",
      results: history.length,
      data: { history },
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getBookHistory = async (req, res) => {
  try {
    const bookId = req.params.id;

    // 1. Find the Book first to ensure it exists
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    // 2. Find borrowing history & populate User details
    // .populate('userId', 'name email') -> Go to User table, get name & email for this ID
    const borrows = await Borrow.find({ bookId: bookId })
      .populate('userId', 'name email') 
      .lean();

    if (borrows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No borrowing history found for this book",
      });
    }

    // 3. Transform the data
    const history = borrows.map((b) => {
      // Handle case where user might have been deleted
      const user = b.userId || null; 

      return {
        borrowId: b._id,
        user: user ? {
            id: user._id,
            name: user.name,
            email: user.email
        } : "Unknown User (Deleted)",
        borrowedOn: b.borrowDate,
        dueDate: b.dueDate,
        returned: b.returned,
        returnedOn: b.returnDate || null,
        
        // Overdue logic using direct Date comparison
        overdue: b.returned 
          ? b.returnDate > b.dueDate 
          : new Date() > b.dueDate
      };
    });

    res.status(200).json({
      status: "success",
      results: history.length,
      data: {
        bookId: book._id,
        title: book.title,
        author: book.author,
        history,
      },
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export { getBookHistory, getUserHistory };
