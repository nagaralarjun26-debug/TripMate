// server/routes/travellers.js
// Traveller Routes: Manage participants and collaborators on a trip

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Models
const Traveller = require('../models/Traveller');
const Trip = require('../models/Trip');
const User = require('../models/User');

// Apply auth middleware to all traveller routes
router.use(auth);

/**
 * @route   GET /api/trips/:tripId/travellers
 * @desc    List all travellers for a trip with user details populated (name, email)
 * @access  Private
 */
router.get('/trips/:tripId/travellers', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const travellers = await Traveller.find({ trip: req.params.tripId }).populate('user', 'name email');
    return res.status(200).json(travellers);
  } catch (error) {
    console.error('[Get Travellers Error]:', error);
    return res.status(500).json({ message: 'Server error fetching travellers', error: error.message });
  }
});

/**
 * @route   POST /api/trips/:tripId/travellers
 * @desc    Add a traveller to a trip by user email
 * @access  Private
 */
router.post(
  '/trips/:tripId/travellers',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email to invite')
      .normalizeEmail(),
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

      const { email, role = 'member' } = req.body;

      // Find user by email
      const userToAdd = await User.findOne({ email });
      if (!userToAdd) {
        return res.status(404).json({ message: 'User with this email not found' });
      }

      // Check if user is already a traveller in this trip
      const existingTraveller = await Traveller.findOne({
        trip: req.params.tripId,
        user: userToAdd._id,
      });

      if (existingTraveller) {
        return res.status(400).json({ message: 'User is already a traveller on this trip' });
      }

      // Create traveller record
      const traveller = new Traveller({
        trip: req.params.tripId,
        user: userToAdd._id,
        role: role === 'owner' ? 'owner' : 'member',
      });

      await traveller.save();
      await traveller.populate('user', 'name email');

      return res.status(201).json(traveller);
    } catch (error) {
      console.error('[Add Traveller Error]:', error);
      return res.status(500).json({ message: 'Server error adding traveller', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/travellers/:id (or /api/trips/:tripId/travellers/:id)
 * @desc    Remove a traveller from a trip
 * @access  Private
 */
router.delete(['/travellers/:id', '/trips/:tripId/travellers/:id'], async (req, res) => {
  try {
    const traveller = await Traveller.findById(req.params.id);
    if (!traveller) {
      return res.status(404).json({ message: 'Traveller record not found' });
    }

    // Do not allow removing the owner
    if (traveller.role === 'owner') {
      return res.status(400).json({ message: 'Cannot remove the owner of the trip' });
    }

    await Traveller.findByIdAndDelete(traveller._id);
    return res.status(200).json({ message: 'Traveller removed successfully' });
  } catch (error) {
    console.error('[Delete Traveller Error]:', error);
    return res.status(500).json({ message: 'Server error removing traveller', error: error.message });
  }
});

module.exports = router;
