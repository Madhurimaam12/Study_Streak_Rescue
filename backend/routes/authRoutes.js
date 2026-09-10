const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'study_streak_rescue_jwt_secret_key_2026',
    {
      expiresIn: '30d',
    }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, themePreference } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      themePreference: themePreference || 'dark',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Study Streak Rescue.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate,
        totalTasksCompleted: user.totalTasksCompleted,
        totalStudyMinutes: user.totalStudyMinutes,
        themePreference: user.themePreference,
      },
    });
  } catch (err) {
    console.error('[AuthRoute] Register error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during registration.',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate student & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Welcome back!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate,
        totalTasksCompleted: user.totalTasksCompleted,
        totalStudyMinutes: user.totalStudyMinutes,
        themePreference: user.themePreference,
      },
    });
  } catch (err) {
    console.error('[AuthRoute] Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile & stats
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate,
        totalTasksCompleted: user.totalTasksCompleted,
        totalStudyMinutes: user.totalStudyMinutes,
        themePreference: user.themePreference,
      },
    });
  } catch (err) {
    console.error('[AuthRoute] Me error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile.',
    });
  }
});

// @route   PUT /api/auth/theme
// @desc    Update user theme preference
// @access  Private
router.put('/theme', protect, async (req, res) => {
  try {
    const { themePreference } = req.body;
    if (!['light', 'dark', 'system'].includes(themePreference)) {
      return res.status(400).json({
        success: false,
        message: 'Theme preference must be light, dark, or system.',
      });
    }

    const user = await User.findById(req.user._id);
    user.themePreference = themePreference;
    await user.save();

    res.json({
      success: true,
      themePreference: user.themePreference,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error updating theme preference.',
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update username and/or password
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    // If changing password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your current password to set a new password.',
        });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect current password.',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        });
      }

      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate,
        totalTasksCompleted: user.totalTasksCompleted,
        totalStudyMinutes: user.totalStudyMinutes,
        themePreference: user.themePreference,
      },
    });
  } catch (err) {
    console.error('[AuthRoute] Update profile error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error updating profile.',
    });
  }
});

module.exports = router;
