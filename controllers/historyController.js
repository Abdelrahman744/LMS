import { books, borrowSheet } from "./booksController.js";

const getUserHistory = (req, res) => {
  const userId = Number(req.params.id);

  // Validate user ID
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid user ID. Must be a positive number",
    });
  }

  const history = borrowSheet
    .filter((b) => b.userId === userId)
    .map((b) => {
      const book = books.find((bk) => bk.id === b.bookId);
      return {
        bookId: b.bookId,
        title: book?.title || `Book ID: ${b.bookId} (Not Found)`,
        author: book?.author || "Unknown",
        borrowedOn: b.borrowDate,
        dueDate: b.dueDate,
        returned: b.returned,
        returnedOn: b.returnDate || null,
        overdue: b.returnDate && b.returnDate > b.dueDate,
      };
    });

  if (history.length === 0) {
    return res.status(200).json({
      status: "success",
      results: 0,
      data: { history: [] },
    });
  }

  res.status(200).json({
    status: "success",
    results: history.length,
    data: { history },
  });
};

const getBookHistory = (req, res) => {
  const bookId = Number(req.params.id);

  // Validate book ID
  if (isNaN(bookId) || bookId <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid book ID. Must be a positive number",
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

  const history = borrowSheet
    .filter((b) => b.bookId === bookId)
    .map((b) => ({
      borrowId: b.id,
      userId: b.userId,
      borrowedOn: b.borrowDate,
      dueDate: b.dueDate,
      returned: b.returned,
      returnedOn: b.returnDate || null,
      overdue: b.returnDate && b.returnDate > b.dueDate,
    }));

  // Handle empty history
  if (history.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No borrowing history found for this book",
    });
  }

  res.status(200).json({
    status: "success",
    results: history.length,
    data: {
      bookId: book.id,
      title: book.title,
      author: book.author,
      history,
    },
  });
};

export { getBookHistory, getUserHistory };
