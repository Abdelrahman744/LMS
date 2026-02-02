import mongoose from "mongoose";
const borrowSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId, // Links to a real Book document
    ref: 'Book',
    required: [true, 'Borrow record must belong to a book']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Links to a real User document
    ref: 'User',
    required: [true, 'Borrow record must belong to a user']
  },
  borrowDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'A due date is required']
  },
  returned: {
    type: Boolean,
    default: false
  },
  returnDate: {
    type: Date,
    default: null
  }
});

// Prevent a user from borrowing the exact same book twice at the same time
// (Unique only if returned is false)
borrowSchema.index({ bookId: 1, returned: 1 });
const Borrow = mongoose.model('Borrow', borrowSchema);
export default Borrow;