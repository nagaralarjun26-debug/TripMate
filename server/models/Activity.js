// server/models/Activity.js
// Activity Model representing scheduled items within an itinerary day

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    itinerary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
      required: [true, 'Itinerary reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Activity name is required'],
      trim: true,
    },
    time: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Activity', activitySchema);
