// server/seed.js
// Database Seed Script: Populates 10 curated travel destinations

require('dotenv').config();
const mongoose = require('mongoose');
const Destination = require('./models/Destination');

// 10 Curated travel destinations with real-sounding details and valid Unsplash photos
const sampleDestinations = [
  {
    name: 'Tokyo',
    country: 'Japan',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
    description: 'A bustling metropolis combining ultra-modern neon-lit skyscrapers with historic temples and serene shrines.',
    highlights: [
      'Shibuya Crossing',
      'Senso-ji Temple',
      'Mount Fuji Day Trip',
      'Tsukiji Outer Market',
      'Akihabara Electric Town',
    ],
  },
  {
    name: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    description: 'The City of Light captivates visitors with iconic architecture, haute cuisine, world-class art museums, and romantic boulevard strolls.',
    highlights: [
      'Eiffel Tower',
      'Louvre Museum',
      'Montmartre',
      'Seine River Cruise',
      'Notre-Dame Cathedral',
    ],
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    description: 'An Indonesian tropical paradise renowned for volcanic mountains, lush terraced rice paddies, ancient temples, and vibrant surf beaches.',
    highlights: [
      'Ubud Monkey Forest',
      'Tegallalang Rice Terraces',
      'Tanah Lot Temple',
      'Mount Batur Sunrise Trek',
      'Seminyak Beach',
    ],
  },
  {
    name: 'Rome',
    country: 'Italy',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    description: 'The Eternal City boasts nearly three millennia of globally influential art, monumental Roman architecture, and delectable culinary traditions.',
    highlights: [
      'Colosseum',
      'Vatican Museums & Sistine Chapel',
      'Pantheon',
      'Trevi Fountain',
      'Trastevere Food Tour',
    ],
  },
  {
    name: 'New York City',
    country: 'United States',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    description: 'The city that never sleeps offers unmatched cultural energy, iconic skylines, world-renowned Broadway theaters, and diverse neighborhoods.',
    highlights: [
      'Central Park',
      'Times Square',
      'Empire State Building',
      'Statue of Liberty',
      'High Line Walk',
    ],
  },
  {
    name: 'Santorini',
    country: 'Greece',
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    description: 'Famed for its dramatic volcanic caldera views, whitewashed cliffside villages, blue-domed churches, and world-class Aegean sunsets.',
    highlights: [
      'Oia Sunset Viewpoint',
      'Red Beach',
      'Fira to Oia Cliff Hike',
      'Akrotiri Archaeological Site',
      'Caldera Catamaran Cruise',
    ],
  },
  {
    name: 'Cape Town',
    country: 'South Africa',
    imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800',
    description: 'A stunning coastal haven set against the dramatic backdrop of Table Mountain, penguin colonies, and world-class wine valleys.',
    highlights: [
      'Table Mountain Cableway',
      'Cape Point Nature Reserve',
      'Boulders Beach Penguins',
      'Kirstenbosch Botanical Gardens',
      'Robben Island',
    ],
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    description: "The cosmopolitan capital of Catalonia celebrated for Antoni Gaudí's whimsical architecture, vibrant Mediterranean beaches, and tapas culture.",
    highlights: [
      'Sagrada Família',
      'Park Güell',
      'Gothic Quarter',
      'La Boqueria Market',
      'Barceloneta Beach',
    ],
  },
  {
    name: 'Dubai',
    country: 'United Arab Emirates',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    description: 'A futuristic oasis renowned for luxury shopping, avant-garde architecture, lively nightlife, and desert safari adventures.',
    highlights: [
      'Burj Khalifa',
      'The Dubai Mall & Fountain Show',
      'Palm Jumeirah',
      'Desert Dune Bashing Safari',
      'Dubai Marina Walk',
    ],
  },
  {
    name: 'Swiss Alps',
    country: 'Switzerland',
    imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800',
    description: 'Majestic snow-capped peaks, crystal-clear alpine lakes, world-class ski slopes, and charming mountain chalets.',
    highlights: [
      'Matterhorn in Zermatt',
      'Jungfraujoch Top of Europe',
      'Lake Geneva & Montreux',
      'Glacier Express Scenic Train',
      'Interlaken Adventure Sports',
    ],
  },
];

/**
 * Main seed function:
 * 1. Connects to MongoDB
 * 2. Deletes existing destinations
 * 3. Inserts 10 curated sample destinations
 * 4. Logs success and disconnects
 */
const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tripmate';
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected successfully.');

    // Remove existing destinations
    console.log('[Seed] Clearing existing destinations collection...');
    const deleteResult = await Destination.deleteMany({});
    console.log(`[Seed] Removed ${deleteResult.deletedCount} existing destinations.`);

    // Insert curated destinations
    console.log('[Seed] Inserting 10 curated destinations...');
    const insertedDestinations = await Destination.insertMany(sampleDestinations);
    console.log(`[Seed] Successfully inserted ${insertedDestinations.length} destinations:`);
    insertedDestinations.forEach((dest, index) => {
      console.log(`  ${index + 1}. ${dest.name}, ${dest.country}`);
    });

    console.log('[Seed] Database seeding completed successfully.');
  } catch (error) {
    console.error('[Seed Error]:', error.message);
  } finally {
    // Close mongoose connection
    await mongoose.connection.close();
    console.log('[Seed] MongoDB connection closed.');
    process.exit(0);
  }
};

seedDatabase();
