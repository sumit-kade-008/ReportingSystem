// server/src/models/User.js
// Defines the User schema supporting 'citizen', 'department', and 'admin' roles.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Hidden from queries by default for security
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['citizen', 'department', 'admin'],
        message: 'Role must be citizen, department, or admin',
      },
      default: 'citizen',
    },
    department: {
      type: String,
      enum: {
        values: ['Road', 'Water', 'Electricity', 'Drainage', 'Tree', 'Fire', 'Sanitation', null],
        message: 'Invalid department specified',
      },
      default: null, // Required if role === 'department'
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt
  }
);

// Mongoose Pre-save Hook: Hash password before saving to the database
// (Viva point: Passwords should never be stored in plain text!)
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare incoming plain password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
