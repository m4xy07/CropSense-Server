const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

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

// Serve static files ONLY for specific paths, not for root
app.use('/ui/static', express.static(path.join(__dirname, 'public')));
app.use('/favicon.ico', express.static(path.join(__dirname, 'public', 'favicon.ico')));

// Modify the endpoint to be at root path '/' instead of '/data'
app.post('/', async (req, res) => {
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

// Also keep the original '/data' endpoint for backward compatibility
app.post('/data', async (req, res) => {
  // Forward to the root handler
  console.log('Received request on legacy /data endpoint, forwarding to root handler');
  req.url = '/';
  app._router.handle(req, res);
});

// Get data from the root path - ALWAYS return JSON regardless of client
app.get('/', async (req, res) => {
  try {
    // Set content type explicitly to application/json
    res.setHeader('Content-Type', 'application/json');
    
    const weatherData = await WeatherData.find({});
    // Always return JSON data directly without redirection
    res.status(200).send(JSON.stringify(weatherData, null, 2));
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Keep the original '/data' endpoint - ALWAYS return JSON regardless of client
app.get('/data', async (req, res) => {
  try {
    // Set content type explicitly to application/json
    res.setHeader('Content-Type', 'application/json');
    
    const weatherData = await WeatherData.find({});
    res.status(200).send(JSON.stringify(weatherData, null, 2));
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a simple landing page at the UI path
app.get('/ui', async (req, res) => {
  try {
    // Fetch recent data from the database directly
    const recentData = await WeatherData.find({})
      .sort({ _id: -1 })
      .limit(5)
      .lean();
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
      <title>CropSense - Data API</title>
      <meta name="description" content="API Data Endpoint for CropSense">
      <meta name="author" content="m4xy07">
      <meta name="keywords" content="CropSense, API, Data, Agriculture, Weather">
      <meta property="og:title" content="CropSense - Data API">
      <meta property="og:description" content="API Data Endpoint for CropSense">
      <meta property="og:image" content="/public/Logo_CropSense_240x240.png">
      <link rel="icon" href="/favicon.ico" type="image/x-icon">
      <style>
        body {
        font-family: Arial, sans-serif;
        margin: 40px;
        line-height: 1.6;
        }
        h1 {
        color: #388E3C;
        }
        .container {
        max-width: 800px;
        margin: 0 auto;
        }
        pre {
        background-color: #f4f4f4;
        padding: 10px;
        border-radius: 5px;
        overflow-x: auto;
        }
        .endpoint {
        font-weight: bold;
        }
        .error {
        color: red;
        }
      </style>
      </head>
      <body>
      <div class="container">
        <h1>CropSense Data Server</h1>
        <p>This server collects and provides agricultural sensor data.</p>
        
        <h2>API Endpoints:</h2>
        <ul>
        <li><span class="endpoint">GET /api/data</span> - Retrieve all stored weather data</li>
        <li><span class="endpoint">POST /</span> - Submit new weather data</li>
        </ul>
        
        <h2>Status:</h2>
        <p>Server is running on <strong>https://data.cropsense.tech</strong></p>
        
        <h2>Recent Data:</h2>
        <div id="recent-data">
        <pre>${JSON.stringify(recentData, null, 2)}</pre>
        </div>
        
        <p><a href="/api/data" target="_blank">View all data (JSON)</a></p>
      </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CropSense - Data API</title>
        <meta name="description" content="API Data Endpoint for CropSense">
        <link rel="icon" href="/favicon.ico" type="image/x-icon">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
          }
          h1 {
            color: #388E3C;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .error {
            color: red;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>CropSense Data Server</h1>
          <p>This server collects and provides agricultural sensor data.</p>
          
          <h2>API Endpoints:</h2>
          <ul>
            <li><span class="endpoint">GET /api/data</span> - Retrieve all stored weather data</li>
            <li><span class="endpoint">POST /</span> - Submit new weather data</li>
          </ul>
          
          <h2>Status:</h2>
          <p>Server is running on <strong>https://data.cropsense.tech</strong></p>
          
          <h2>Recent Data:</h2>
          <div id="recent-data" class="error">
            Error fetching data: ${error.message}
          </div>
          
          <p><a href="/api/data" target="_blank">View all data (JSON)</a></p>
        </div>
      </body>
      </html>
    `);
  }
});

// Add a dedicated API endpoint for JSON data
app.get('/api/data', async (req, res) => {
  try {
    // Set content type explicitly to application/json
    res.setHeader('Content-Type', 'application/json');
    
    const weatherData = await WeatherData.find({});
    res.status(200).send(JSON.stringify(weatherData, null, 2));
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create HTTP server with error handling
try {
  const httpServer = http.createServer(app);
  httpServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error('Port 80 is already in use. HTTP server could not be started.');
      console.error('This might interfere with Let\'s Encrypt certificate validation.');
      console.error('Run "sudo lsof -i :80" to identify which process is using port 80');
    } else {
      console.error('HTTP server error:', error.message);
    }
  });
  
  httpServer.listen(80, () => {
    console.log('HTTP server is running on port 80');
  });
} catch (error) {
  console.error('Failed to start HTTP server:', error.message);
}

// Only start HTTPS server if SSL files exist
try {
  const httpsOptions = {
    key: fs.readFileSync(__dirname + "/ssl/server.key"),
    cert: fs.readFileSync(__dirname + "/ssl/server.crt"),
  };

  const httpsServer = https.createServer(httpsOptions, app);
  httpsServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error('Port 443 is already in use. HTTPS server could not be started.');
      console.error('Run "sudo lsof -i :443" to identify which process is using port 443');
    } else {
      console.error('HTTPS server error:', error.message);
    }
  });
  
  httpsServer.listen(443, () => {
    console.log('HTTPS server is running on port 443 (data.cropsense.tech)');
  });
} catch (error) {
  console.error('Could not start HTTPS server:', error.message);
  console.log('Please run the SSL certificate setup script first');
}