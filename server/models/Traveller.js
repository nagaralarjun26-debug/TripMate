// server/models/Traveller.js
// Traveller Model representing participants/collaborators of a trip

const mongoose = require('mongoose');

const travellerSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['owner', 'member'],
        message: '{VALUE} is not a valid traveller role',
      },
      default: 'member',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index on (trip, user) to prevent duplicate members in the same trip
travellerSchema.index({ trip: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Traveller', travellerSchema);
