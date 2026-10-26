// server/index.js
// Main entry point for TripMate Express API

// 1. Load environment variables
require('dotenv').config();

// 2. Import dependencies
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const itineraryRoutes = require('./routes/itineraries');
const activityRoutes = require('./routes/activities');
const expenseRoutes = require('./routes/expenses');
const travellerRoutes = require('./routes/travellers');
const settlementRoutes = require('./routes/settlements');
const destinationRoutes = require('./routes/destinations');

// 3. Initialize Express app and connect to Database
const app = express();
connectDB();

// 4. Middlewares
app.use(cors());
app.use(express.json());

// 5. Mount API Routes
// Authentication
app.use('/api/auth', authRoutes);

// Destinations (Public)
app.use('/api/destinations', destinationRoutes);

// Sub-resource and relational routes (Itineraries, Activities, Expenses, Travellers, Settlements)
app.use('/api', itineraryRoutes);
app.use('/api', activityRoutes);
app.use('/api', expenseRoutes);
app.use('/api', travellerRoutes);
app.use('/api', settlementRoutes);

// Trips (Private)
app.use('/api/trips', tripRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Welcome to TripMate API',
    version: '1.0.0',
    documentation: {
      auth: '/api/auth',
      trips: '/api/trips',
      destinations: '/api/destinations',
    },
  });
});

// 404 Route Handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// 6. Listen on PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TripMate backend server is running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});
