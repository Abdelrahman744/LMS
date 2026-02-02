import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A book must have a title'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'A book must have an author'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'A book must have a category'], // e.g., "Fiction", "Sci-Fi"
    trim: true
  },
  isbn: {
    type: String,
    required: [true, 'A book must have an ISBN'],
    unique: true,
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  },
  // Optional: If you want to track physical stock count
  stock: {
    type: Number,
    default: 1,
    min: [0, 'Stock cannot be negative']
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster searching by title or author
bookSchema.index({ title: 'text', author: 'text' });

const Book = mongoose.model('Book', bookSchema);



export default Book;
