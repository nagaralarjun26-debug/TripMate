// server/routes/auth.js
// Authentication Routes: Register, Login, and Current User profile

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * Helper to generate JWT Token
 * Payload includes { userId: user._id }
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'tripmate_dev_secret_change_in_production';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, hash password, and return JWT token
 * @access  Public
 */
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email address' });
      }

      // Create new user (password is automatically hashed via pre-save hook in User model)
      const user = new User({
        name,
        email,
        password,
      });

      await user.save();

      // Generate JWT Token
      const token = generateToken(user._id);

      // Return token and sanitized user details
      return res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('[Auth Register Error]:', error);
      return res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user by email and password, return JWT token
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  async (req, res) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Compare candidate password with stored hash
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Generate JWT Token
      const token = generateToken(user._id);

      // Return token and user details
      return res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('[Auth Login Error]:', error);
      return res.status(500).json({ message: 'Server error during login', error: error.message });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (auth required)
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error('[Auth Me Error]:', error);
    return res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
});

module.exports = router;
