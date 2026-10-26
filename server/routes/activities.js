// server/routes/activities.js
// Activity Routes: Managing scheduled activities inside itinerary days

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Models
const Activity = require('../models/Activity');
const Itinerary = require('../models/Itinerary');
const Trip = require('../models/Trip');

// Apply auth middleware to all activity routes
router.use(auth);

/**
 * @route   GET /api/itineraries/:itineraryId/activities
 * @desc    List all activities for an itinerary day
 * @access  Private
 */
router.get('/itineraries/:itineraryId/activities', async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.itineraryId);
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Verify trip ownership/access
    const trip = await Trip.findById(itinerary.trip);
    if (!trip || trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view these activities' });
    }

    const activities = await Activity.find({ itinerary: req.params.itineraryId }).sort({ time: 1 });
    return res.status(200).json(activities);
  } catch (error) {
    console.error('[Get Activities Error]:', error);
    return res.status(500).json({ message: 'Server error fetching activities', error: error.message });
  }
});

/**
 * @route   POST /api/itineraries/:itineraryId/activities
 * @desc    Create a new activity in an itinerary day
 * @access  Private
 */
router.post(
  '/itineraries/:itineraryId/activities',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Activity name is required'),
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    try {
      const itinerary = await Itinerary.findById(req.params.itineraryId);
      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
      }

      // Verify trip ownership
      const trip = await Trip.findById(itinerary.trip);
      if (!trip || trip.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: You do not have permission to add activities to this trip' });
      }

      const { name, time = '', location = '', notes = '' } = req.body;

      const activity = new Activity({
        itinerary: req.params.itineraryId,
        name,
        time,
        location,
        notes,
      });

      await activity.save();
      return res.status(201).json(activity);
    } catch (error) {
      console.error('[Create Activity Error]:', error);
      return res.status(500).json({ message: 'Server error creating activity', error: error.message });
    }
  }
);

/**
 * @route   GET /api/activities/:id (or /api/itineraries/:itineraryId/activities/:id)
 * @desc    Get a single activity
 * @access  Private
 */
router.get(['/activities/:id', '/itineraries/:itineraryId/activities/:id'], async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check ownership through itinerary -> trip
    const itinerary = await Itinerary.findById(activity.itinerary);
    if (!itinerary) {
      return res.status(404).json({ message: 'Parent itinerary not found' });
    }

    const trip = await Trip.findById(itinerary.trip);
    if (!trip || trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not have permission for this activity' });
    }

    return res.status(200).json(activity);
  } catch (error) {
    console.error('[Get Single Activity Error]:', error);
    return res.status(500).json({ message: 'Server error fetching activity', error: error.message });
  }
});

/**
 * @route   PUT /api/activities/:id (or /api/itineraries/:itineraryId/activities/:id)
 * @desc    Update an activity
 * @access  Private
 */
router.put(['/activities/:id', '/itineraries/:itineraryId/activities/:id'], async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Verify ownership through itinerary -> trip
    const itinerary = await Itinerary.findById(activity.itinerary);
    if (!itinerary) {
      return res.status(404).json({ message: 'Parent itinerary not found' });
    }

    const trip = await Trip.findById(itinerary.trip);
    if (!trip || trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the owner of this trip' });
    }

    const { name, time, location, notes } = req.body;
    if (name !== undefined) activity.name = name;
    if (time !== undefined) activity.time = time;
    if (location !== undefined) activity.location = location;
    if (notes !== undefined) activity.notes = notes;

    const updatedActivity = await activity.save();
    return res.status(200).json(updatedActivity);
  } catch (error) {
    console.error('[Update Activity Error]:', error);
    return res.status(500).json({ message: 'Server error updating activity', error: error.message });
  }
});

/**
 * @route   DELETE /api/activities/:id (or /api/itineraries/:itineraryId/activities/:id)
 * @desc    Delete an activity
 * @access  Private
 */
router.delete(['/activities/:id', '/itineraries/:itineraryId/activities/:id'], async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Verify ownership through itinerary -> trip
    const itinerary = await Itinerary.findById(activity.itinerary);
    if (!itinerary) {
      return res.status(404).json({ message: 'Parent itinerary not found' });
    }

    const trip = await Trip.findById(itinerary.trip);
    if (!trip || trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the owner of this trip' });
    }

    await Activity.findByIdAndDelete(activity._id);
    return res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('[Delete Activity Error]:', error);
    return res.status(500).json({ message: 'Server error deleting activity', error: error.message });
  }
});

module.exports = router;
