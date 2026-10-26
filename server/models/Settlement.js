// server/models/Settlement.js
// Settlement Model for peer-to-peer debt resolution in group trips

const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Debtor (fromUser) reference is required'],
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creditor (toUser) reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Settlement amount is required'],
      min: [0, 'Amount must be at least 0'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'settled'],
        message: '{VALUE} is not a valid settlement status',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settlement', settlementSchema);
