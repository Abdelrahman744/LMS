import Book from "../models/booksModel.js";
import Borrow from "../models/borrowModel.js";
import User from "../models/usersModel.js";
import AppError from "../utils/appError.js"; 



const getUserHistory = async (req, res,next) => {
  try {
    const userId = req.params.id;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return next(new AppError("You do not have permission to view this user's history.", 403));
    }
    // 1. Find all borrow records & automatically fill in the Book details
    
    const borrows = await Borrow.find({ userId: userId })
      .populate('bookId', 'title author') 
      .lean(); 

    if (!borrows.length) {
      return res.status(200).json({
        status: "success",
        results: 0,
        data: { history: [] },
      });
    }

    // 2. Format the data for the response
    const history = borrows.map((b) => {
      
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
        
        
        overdue: b.returned 
          ? b.returnDate > b.dueDate 
          : Date.now() > new Date(b.dueDate).getTime()   
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
        
      
        overdue: b.returned 
          ? b.returnDate > b.dueDate 
          : Date.now() > new Date(b.dueDate).getTime()
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
