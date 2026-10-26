// server/routes/destinations.js
// Destination Routes: Public exploration of destinations with keyword search

const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');

/**
 * @route   GET /api/destinations
 * @desc    Get all destinations, with optional ?search= filter matching name or country
 * @access  Public (no authentication required)
 */
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    // If search parameter is provided, filter by name or country (case-insensitive)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter = {
        $or: [{ name: searchRegex }, { country: searchRegex }],
      };
    }

    const destinations = await Destination.find(filter).sort({ name: 1 });
    return res.status(200).json(destinations);
  } catch (error) {
    console.error('[Get Destinations Error]:', error);
    return res.status(500).json({ message: 'Server error fetching destinations', error: error.message });
  }
});

/**
 * @route   GET /api/destinations/:id
 * @desc    Get single destination by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    return res.status(200).json(destination);
  } catch (error) {
    console.error('[Get Single Destination Error]:', error);
    return res.status(500).json({ message: 'Server error fetching destination', error: error.message });
  }
});

module.exports = router;
