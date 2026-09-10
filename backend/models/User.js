const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: String, // Stored as 'YYYY-MM-DD'
      default: null,
    },
    totalTasksCompleted: {
      type: Number,
      default: 0,
    },
    totalStudyMinutes: {
      type: Number,
      default: 0,
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'dark',
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Record study activity and intelligently update streak
UserSchema.methods.recordActivity = async function (minutesLogged = 0) {
  const today = new Date().toISOString().split('T')[0];

  if (this.lastActiveDate === today) {
    // Already active today; just add minutes
    if (minutesLogged > 0) {
      this.totalStudyMinutes += minutesLogged;
    }
    this.totalTasksCompleted += 1;
    await this.save();
    return;
  }

  if (!this.lastActiveDate) {
    // First time active
    this.currentStreak = 1;
    this.longestStreak = Math.max(this.longestStreak, 1);
  } else {
    // Calculate difference in days
    const lastDate = new Date(this.lastActiveDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day: increment streak
      this.currentStreak += 1;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
    } else if (diffDays > 1) {
      // Missed more than 1 day: reset streak to 1
      this.currentStreak = 1;
    }
  }

  this.lastActiveDate = today;
  this.totalTasksCompleted += 1;
  if (minutesLogged > 0) {
    this.totalStudyMinutes += minutesLogged;
  }

  await this.save();
};

module.exports = mongoose.model('User', UserSchema);
