// server/routes/settlements.js
// Settlement Routes: Manage debt settlements between trip members

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Models
const Settlement = require('../models/Settlement');
const Trip = require('../models/Trip');

// Apply auth middleware to all settlement routes
router.use(auth);

/**
 * @route   GET /api/trips/:tripId/settlements
 * @desc    List all settlements for a trip with fromUser and toUser populated
 * @access  Private
 */
router.get('/trips/:tripId/settlements', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const settlements = await Settlement.find({ trip: req.params.tripId })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(settlements);
  } catch (error) {
    console.error('[Get Settlements Error]:', error);
    return res.status(500).json({ message: 'Server error fetching settlements', error: error.message });
  }
});

/**
 * @route   POST /api/trips/:tripId/settlements
 * @desc    Create a new settlement between two travellers
 * @access  Private
 */
router.post(
  '/trips/:tripId/settlements',
  [
    body('fromUser')
      .notEmpty()
      .withMessage('Debtor (fromUser) is required'),
    body('toUser')
      .notEmpty()
      .withMessage('Creditor (toUser) is required'),
    body('amount')
      .notEmpty()
      .withMessage('Settlement amount is required')
      .isFloat({ min: 0 })
      .withMessage('Settlement amount must be at least 0'),
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

      const { fromUser, toUser, amount, status = 'pending' } = req.body;

      if (fromUser.toString() === toUser.toString()) {
        return res.status(400).json({ message: 'fromUser and toUser cannot be the same user' });
      }

      const settlement = new Settlement({
        trip: req.params.tripId,
        fromUser,
        toUser,
        amount,
        status: status === 'settled' ? 'settled' : 'pending',
      });

      await settlement.save();
      await settlement.populate('fromUser', 'name email');
      await settlement.populate('toUser', 'name email');

      return res.status(201).json(settlement);
    } catch (error) {
      console.error('[Create Settlement Error]:', error);
      return res.status(500).json({ message: 'Server error creating settlement', error: error.message });
    }
  }
);

/**
 * @route   GET /api/settlements/:id (or /api/trips/:tripId/settlements/:id)
 * @desc    Get single settlement
 * @access  Private
 */
router.get(['/settlements/:id', '/trips/:tripId/settlements/:id'], async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email');

    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    return res.status(200).json(settlement);
  } catch (error) {
    console.error('[Get Single Settlement Error]:', error);
    return res.status(500).json({ message: 'Server error fetching settlement', error: error.message });
  }
});

/**
 * @route   PUT /api/settlements/:id (or /api/trips/:tripId/settlements/:id)
 * @desc    Update a settlement (e.g., mark as settled)
 * @access  Private
 */
router.put(['/settlements/:id', '/trips/:tripId/settlements/:id'], async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    const { status, amount, fromUser, toUser } = req.body;
    if (status !== undefined) settlement.status = status;
    if (amount !== undefined) settlement.amount = amount;
    if (fromUser !== undefined) settlement.fromUser = fromUser;
    if (toUser !== undefined) settlement.toUser = toUser;

    const updatedSettlement = await settlement.save();
    await updatedSettlement.populate('fromUser', 'name email');
    await updatedSettlement.populate('toUser', 'name email');

    return res.status(200).json(updatedSettlement);
  } catch (error) {
    console.error('[Update Settlement Error]:', error);
    return res.status(500).json({ message: 'Server error updating settlement', error: error.message });
  }
});

/**
 * @route   DELETE /api/settlements/:id (or /api/trips/:tripId/settlements/:id)
 * @desc    Delete a settlement
 * @access  Private
 */
router.delete(['/settlements/:id', '/trips/:tripId/settlements/:id'], async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    await Settlement.findByIdAndDelete(settlement._id);
    return res.status(200).json({ message: 'Settlement deleted successfully' });
  } catch (error) {
    console.error('[Delete Settlement Error]:', error);
    return res.status(500).json({ message: 'Server error deleting settlement', error: error.message });
  }
});

module.exports = router;
