#!/usr/bin/env bash

echo "Seeding the MongoDB database with sample data..."

# Create a JavaScript file with seeding code
cat > /root/seed-db.js << 'EOL'
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/weather-data', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the schema
const weatherSchema = new mongoose.Schema({
  time: String,
  temperature: Number,
  humidity: Number,
  aqi: Number,
  hi: Number,
  alt: Number,
  pres: Number,
  moisture: Number,
  raining: String,
  wifiStrength: Number,
  best_crop: String,
  recommended_fertilizer: String,
  npk_uptake_nitrogen: Number,
  npk_uptake_phosphorus: Number,
  npk_uptake_potassium: Number,
  harvestable_months: [
    {
      month: String,
      wholesale_price: Number,
      retail_price: Number
    }
  ]
});

// Create the model
const WeatherData = mongoose.model('WeatherData', weatherSchema);

// Function to create a sample entry
const createSampleEntry = async (date) => {
  const entry = new WeatherData({
    time: date,
    temperature: Math.floor(Math.random() * 15) + 20, // 20-35
    humidity: Math.floor(Math.random() * 30) + 50, // 50-80
    aqi: Math.floor(Math.random() * 100) + 20, // 20-120
    hi: Math.floor(Math.random() * 15) + 20, // 20-35
    alt: Math.floor(Math.random() * 100) + 400, // 400-500
    pres: Math.floor(Math.random() * 20) + 1000, // 1000-1020
    moisture: Math.floor(Math.random() * 50) + 30, // 30-80
    raining: Math.random() > 0.7 ? 'yes' : 'no',
    wifiStrength: -(Math.floor(Math.random() * 30) + 50), // -50 to -80
    best_crop: ['tomato', 'wheat', 'rice', 'potato', 'maize'][Math.floor(Math.random() * 5)],
    recommended_fertilizer: ['NPK 10-5-5', 'Urea', 'DAP', 'Organic Compost'][Math.floor(Math.random() * 4)],
    npk_uptake_nitrogen: Math.floor(Math.random() * 50) + 50, // 50-100
    npk_uptake_phosphorus: Math.floor(Math.random() * 30) + 30, // 30-60
    npk_uptake_potassium: Math.floor(Math.random() * 40) + 40, // 40-80
    harvestable_months: [
      {
        month: ['January', 'February', 'March', 'April', 'May', 'June'][Math.floor(Math.random() * 6)],
        wholesale_price: Math.floor(Math.random() * 30) + 30,
        retail_price: Math.floor(Math.random() * 30) + 60
      },
      {
        month: ['July', 'August', 'September', 'October', 'November', 'December'][Math.floor(Math.random() * 6)],
        wholesale_price: Math.floor(Math.random() * 30) + 30,
        retail_price: Math.floor(Math.random() * 30) + 60
      }
    ]
  });

  await entry.save();
  console.log(`Added sample data for ${date}`);
};

// Main seeding function
const seedDatabase = async () => {
  try {
    // Check if database is empty
    const count = await WeatherData.countDocuments();
    
    if (count === 0) {
      console.log('Database is empty. Adding sample data...');
      
      // Create 10 sample entries with different dates
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        const date = new Date(now - i * 3600000); // Each entry 1 hour apart
        await createSampleEntry(date.toISOString().replace('T', ' ').substring(0, 19));
      }
      
      console.log('Sample data added successfully!');
    } else {
      console.log(`Database already has ${count} entries. No sample data needed.`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding function
seedDatabase();
EOL

# Run the seeding script
cd /root/CropSense-Server
node /root/seed-db.js

echo "Database seeding complete."
