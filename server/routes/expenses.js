// server/routes/expenses.js
// Expense Routes: Tracking expenses, categories, and payers

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Models
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');

// Apply auth middleware to all expense routes
router.use(auth);

/**
 * @route   GET /api/trips/:tripId/expenses
 * @desc    List all expenses for a trip with payer details populated (name, email)
 * @access  Private
 */
router.get('/trips/:tripId/expenses', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const expenses = await Expense.find({ trip: req.params.tripId })
      .populate('payer', 'name email')
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json(expenses);
  } catch (error) {
    console.error('[Get Expenses Error]:', error);
    return res.status(500).json({ message: 'Server error fetching expenses', error: error.message });
  }
});

/**
 * @route   POST /api/trips/:tripId/expenses
 * @desc    Create a new expense (payer defaults to authenticated user if not provided)
 * @access  Private
 */
router.post(
  '/trips/:tripId/expenses',
  [
    body('amount')
      .notEmpty()
      .withMessage('Expense amount is required')
      .isFloat({ min: 0 })
      .withMessage('Expense amount must be a positive number'),
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    try {
      const trip = await Trip.findById(req.params.tripId);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      const {
        amount,
        category = 'Other',
        description = '',
        date = Date.now(),
        payer = req.user.id, // defaults to current user
      } = req.body;

      const expense = new Expense({
        trip: req.params.tripId,
        payer,
        amount,
        category,
        description,
        date,
      });

      await expense.save();
      await expense.populate('payer', 'name email');

      return res.status(201).json(expense);
    } catch (error) {
      console.error('[Create Expense Error]:', error);
      return res.status(500).json({ message: 'Server error creating expense', error: error.message });
    }
  }
);

/**
 * @route   GET /api/expenses/:id (or /api/trips/:tripId/expenses/:id)
 * @desc    Get single expense by ID
 * @access  Private
 */
router.get(['/expenses/:id', '/trips/:tripId/expenses/:id'], async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('payer', 'name email');
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(expense);
  } catch (error) {
    console.error('[Get Single Expense Error]:', error);
    return res.status(500).json({ message: 'Server error fetching expense', error: error.message });
  }
});

/**
 * @route   PUT /api/expenses/:id (or /api/trips/:tripId/expenses/:id)
 * @desc    Update an existing expense
 * @access  Private
 */
router.put(['/expenses/:id', '/trips/:tripId/expenses/:id'], async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { amount, category, description, date, payer } = req.body;
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = date;
    if (payer !== undefined) expense.payer = payer;

    const updatedExpense = await expense.save();
    await updatedExpense.populate('payer', 'name email');

    return res.status(200).json(updatedExpense);
  } catch (error) {
    console.error('[Update Expense Error]:', error);
    return res.status(500).json({ message: 'Server error updating expense', error: error.message });
  }
});

/**
 * @route   DELETE /api/expenses/:id (or /api/trips/:tripId/expenses/:id)
 * @desc    Delete an expense
 * @access  Private
 */
router.delete(['/expenses/:id', '/trips/:tripId/expenses/:id'], async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(expense._id);
    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('[Delete Expense Error]:', error);
    return res.status(500).json({ message: 'Server error deleting expense', error: error.message });
  }
});

module.exports = router;
