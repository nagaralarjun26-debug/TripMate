// server/routes/itineraries.js
// Itinerary Routes: Day-by-day scheduling for trips

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Models
const Itinerary = require('../models/Itinerary');
const Activity = require('../models/Activity');
const Trip = require('../models/Trip');

// Apply auth middleware to all itinerary routes
router.use(auth);

/**
 * @route   GET /api/trips/:tripId/itineraries
 * @desc    List all itinerary days for a specific trip (verifies trip ownership)
 * @access  Private
 */
router.get('/trips/:tripId/itineraries', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify trip ownership
    if (trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the owner of this trip' });
    }

    // Sort itineraries by dayNumber ascending
    const itineraries = await Itinerary.find({ trip: req.params.tripId }).sort({ dayNumber: 1 });
    return res.status(200).json(itineraries);
  } catch (error) {
    console.error('[Get Itineraries Error]:', error);
    return res.status(500).json({ message: 'Server error fetching itineraries', error: error.message });
  }
});

/**
 * @route   POST /api/trips/:tripId/itineraries
 * @desc    Create a new itinerary day for a trip (verifies trip ownership)
 * @access  Private
 */
router.post(
  '/trips/:tripId/itineraries',
  [
    body('dayNumber')
      .notEmpty()
      .withMessage('Day number is required')
      .isInt({ min: 1 })
      .withMessage('Day number must be an integer >= 1'),
    body('date')
      .notEmpty()
      .withMessage('Date is required')
      .isISO8601()
      .withMessage('Date must be a valid ISO date'),
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

      // Verify trip ownership
      if (trip.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: You are not the owner of this trip' });
      }

      const { dayNumber, date, title = '', description = '' } = req.body;

      const itinerary = new Itinerary({
        trip: req.params.tripId,
        dayNumber,
        date,
        title,
        description,
      });

      await itinerary.save();
      return res.status(201).json(itinerary);
    } catch (error) {
      console.error('[Create Itinerary Error]:', error);
      return res.status(500).json({ message: 'Server error creating itinerary', error: error.message });
    }
  }
);

/**
 * @route   GET /api/itineraries/:id (or /api/trips/:tripId/itineraries/:id)
 * @desc    Get single itinerary item by ID
 * @access  Private
 */
router.get(['/itineraries/:id', '/trips/:tripId/itineraries/:id'], async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    const trip = await Trip.findById(itinerary.trip);
    if (!trip || trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not have permission for this itinerary' });
    }

    return res.status(200).json(itinerary);
  } catch (error) {
    console.error('[Get Single Itinerary Error]:', error);
    return res.status(500).json({ message: 'Server error fetching itinerary', error: error.message });
  }
});

/**
 * @route   PUT /api/itineraries/:id (or /api/trips/:tripId/itineraries/:id)
 * @desc    Update an itinerary day (verifies trip ownership)
 * @access  Private
 */
router.put(['/itineraries/:id', '/trips/:tripId/itineraries/:id'], async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Verify trip ownership
    const trip = await Trip.findById(itinerary.trip);
    if (!trip || trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the owner of this trip' });
    }

    const { dayNumber, date, title, description } = req.body;
    if (dayNumber !== undefined) itinerary.dayNumber = dayNumber;
    if (date !== undefined) itinerary.date = date;
    if (title !== undefined) itinerary.title = title;
    if (description !== undefined) itinerary.description = description;

    const updatedItinerary = await itinerary.save();
    return res.status(200).json(updatedItinerary);
  } catch (error) {
    console.error('[Update Itinerary Error]:', error);
    return res.status(500).json({ message: 'Server error updating itinerary', error: error.message });
  }
});

/**
 * @route   DELETE /api/itineraries/:id (or /api/trips/:tripId/itineraries/:id)
 * @desc    Delete itinerary day and cascade delete its activities (verifies trip ownership)
 * @access  Private
 */
router.delete(['/itineraries/:id', '/trips/:tripId/itineraries/:id'], async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Verify trip ownership
    const trip = await Trip.findById(itinerary.trip);
    if (!trip || trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the owner of this trip' });
    }

    // 1. Delete all activities associated with this itinerary
    await Activity.deleteMany({ itinerary: itinerary._id });

    // 2. Delete the itinerary itself
    await Itinerary.findByIdAndDelete(itinerary._id);

    return res.status(200).json({
      message: 'Itinerary and its associated activities deleted successfully',
    });
  } catch (error) {
    console.error('[Delete Itinerary Error]:', error);
    return res.status(500).json({ message: 'Server error deleting itinerary', error: error.message });
  }
});

module.exports = router;
