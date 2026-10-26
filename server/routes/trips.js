// server/routes/trips.js
// Trip Routes: CRUD operations for trips and cascading deletions

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Models
const Trip = require('../models/Trip');
const Traveller = require('../models/Traveller');
const Itinerary = require('../models/Itinerary');
const Activity = require('../models/Activity');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');

// Apply auth middleware to all routes in this file
router.use(auth);

/**
 * @route   GET /api/trips
 * @desc    List all trips where the authenticated user is the owner
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(trips);
  } catch (error) {
    console.error('[Get Trips Error]:', error);
    return res.status(500).json({ message: 'Server error fetching trips', error: error.message });
  }
});

/**
 * @route   POST /api/trips
 * @desc    Create a new trip and add the creator as a Traveller with role 'owner'
 * @access  Private
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Trip name is required'),
    body('startDate')
      .notEmpty()
      .withMessage('Start date is required')
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    body('endDate')
      .notEmpty()
      .withMessage('End date is required')
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    body('budgetTotal')
      .notEmpty()
      .withMessage('Total budget is required')
      .isFloat({ min: 0 })
      .withMessage('Budget must be a non-negative number'),
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    try {
      const {
        name,
        destination = '',
        startDate,
        endDate,
        budgetTotal,
        description = '',
        imageUrl = '',
      } = req.body;

      // Create new trip with current user as owner
      const trip = new Trip({
        owner: req.user.id,
        name,
        destination,
        startDate,
        endDate,
        budgetTotal,
        description,
        imageUrl,
      });

      await trip.save();

      // Automatically register the owner as a Traveller with role 'owner'
      await Traveller.create({
        trip: trip._id,
        user: req.user.id,
        role: 'owner',
      });

      return res.status(201).json(trip);
    } catch (error) {
      console.error('[Create Trip Error]:', error);
      return res.status(500).json({ message: 'Server error creating trip', error: error.message });
    }
  }
);

/**
 * @route   GET /api/trips/:id
 * @desc    Get single trip details (must be owner)
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    if (trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the owner of this trip' });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error('[Get Single Trip Error]:', error);
    return res.status(500).json({ message: 'Server error fetching trip', error: error.message });
  }
});

/**
 * @route   PUT /api/trips/:id
 * @desc    Update a trip (must be owner)
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    if (trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the owner of this trip' });
    }

    const {
      name,
      destination,
      startDate,
      endDate,
      budgetTotal,
      description,
      imageUrl,
    } = req.body;

    if (name !== undefined) trip.name = name;
    if (destination !== undefined) trip.destination = destination;
    if (startDate !== undefined) trip.startDate = startDate;
    if (endDate !== undefined) trip.endDate = endDate;
    if (budgetTotal !== undefined) trip.budgetTotal = budgetTotal;
    if (description !== undefined) trip.description = description;
    if (imageUrl !== undefined) trip.imageUrl = imageUrl;

    const updatedTrip = await trip.save();
    return res.status(200).json(updatedTrip);
  } catch (error) {
    console.error('[Update Trip Error]:', error);
    return res.status(500).json({ message: 'Server error updating trip', error: error.message });
  }
});

/**
 * @route   DELETE /api/trips/:id
 * @desc    Delete trip and cascade delete related itineraries, activities, expenses, travellers, settlements
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    if (trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the owner of this trip' });
    }

    const tripId = trip._id;

    // 1. Find all itineraries for this trip to get their IDs
    const itineraries = await Itinerary.find({ trip: tripId }).select('_id');
    const itineraryIds = itineraries.map((item) => item._id);

    // 2. Delete all activities linked to those itineraries
    if (itineraryIds.length > 0) {
      await Activity.deleteMany({ itinerary: { $in: itineraryIds } });
    }

    // 3. Delete all itineraries for this trip
    await Itinerary.deleteMany({ trip: tripId });

    // 4. Delete all expenses for this trip
    await Expense.deleteMany({ trip: tripId });

    // 5. Delete all travellers associated with this trip
    await Traveller.deleteMany({ trip: tripId });

    // 6. Delete all settlements associated with this trip
    await Settlement.deleteMany({ trip: tripId });

    // 7. Finally delete the trip itself
    await Trip.findByIdAndDelete(tripId);

    return res.status(200).json({
      message: 'Trip and all related itineraries, activities, expenses, travellers, and settlements deleted successfully',
    });
  } catch (error) {
    console.error('[Delete Trip Error]:', error);
    return res.status(500).json({ message: 'Server error deleting trip', error: error.message });
  }
});

module.exports = router;
