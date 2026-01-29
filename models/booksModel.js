const mongoose = require('mongoose');

const booksSchema = new mongoose.Schema({
  
  id: Number,
  title: String,
  author: String,
  category: String,
  isbn: String,
  available: Boolean,
  borrowedBy: Number,
  borrowedAt: String,
  dueDate: String


});

const Book = mongoose.model('Book', booksSchema);
module.exports = Book;
