const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB using mongoose
mongoose.connect('mongodb://127.0.0.1:27017/weather-data', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB server');
});

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

const WeatherData = mongoose.model('WeatherData', weatherSchema);

app.post('/data', async (req, res) => {
  // Print out the JSON data being received
  console.log('Received JSON data:', req.body);

  // Create a new weather document
  const newWeatherData = new WeatherData({
    time: req.body.time || null,
    temperature: req.body.temperature || null,
    humidity: req.body.humidity || null,
    aqi: req.body.aqi || null,
    hi: req.body.hi || null,
    alt: req.body.alt || null,
    pres: req.body.pres || null,
    moisture: req.body.moisture || null,
    raining: req.body.raining || null,
    wifiStrength: req.body.wifi_strength || null,
    best_crop: req.body.best_crop || null,
    recommended_fertilizer: req.body.recommended_fertilizer || null,
    npk_uptake_nitrogen: req.body.npk_uptake_nitrogen || null,
    npk_uptake_phosphorus: req.body.npk_uptake_phosphorus || null,
    npk_uptake_potassium: req.body.npk_uptake_potassium || null,
    harvestable_months: req.body.harvestable_months ? req.body.harvestable_months.map(month => ({
      month: month.month || null,
      wholesale_price: month.wholesale_price || null,
      retail_price: month.retail_price || null
    })) : []
  });

  // Print out the data being saved to the database
  console.log('Saving weather data:', newWeatherData);

  // Save the new weather document to the database
  await newWeatherData.save();

  // Send a response back to the client
  res.status(200).send('Data received and saved to database');
});

app.get('/data', async (req, res) => {
  const weatherData = await WeatherData.find({});
  res.status(200).json(weatherData);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});