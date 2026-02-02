import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Mongoose creates _id automatically. 
  // If you want to keep your old IDs (1, 2, 3) for migration, uncomment the next line:
  // id: { type: Number, unique: true }, 

  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must be less than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true, // Ensures no two users have the same email
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // IMPORTANT: Never send password in output by default
  },
  role: {
    type: String,
    enum: ['member', 'admin'], // Restricts role to only these values
    default: 'member'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

const admin1 = new User({
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'securepassword',
  role: 'admin'
});
admin1.save();

export default User;
