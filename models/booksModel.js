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
    required: [true, 'A book must have a category'], 
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
 
  stock: {
    type: Number,
    default: 1,
    min: [0, 'Stock cannot be negative']
  }
}, {
  
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 

});


bookSchema.index({ title: 'text', author: 'text' });

const Book = mongoose.model('Book', bookSchema);

bookSchema.virtual('borrowHistory', {
  ref: 'Borrow',
  localField: '_id',
  foreignField: 'bookId'
});

export default Book;
