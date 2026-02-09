import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema({


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
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  activated: {
    type: Boolean,
    default: true,
    select: false 

  }
  
});

userSchema.pre('save', async function (next){
  if (!this.isModified('password')) return next(); 

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
 return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; 
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ activated: { $ne: false } });
  next();
}); 




userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;  
  return resetToken;
};

const User = mongoose.model('User', userSchema);




export default User;
