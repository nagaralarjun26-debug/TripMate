// server/models/Expense.js
// Expense Model for tracking costs incurred during a trip

const mongoose = require('mongoose');

const expenseCategories = [
  'Food',
  'Transport',
  'Accommodation',
  'Activities',
  'Shopping',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Expense amount must be at least 0'],
    },
    category: {
      type: String,
      enum: {
        values: expenseCategories,
        message: '{VALUE} is not a valid expense category',
      },
      default: 'Other',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Expense', expenseSchema);
