const axios = require("axios");

const crops = ["corn", "wheat", "rice", "soybean", "barley"];
const fertilizers = ["NPK 20-20-20", "NPK 10-10-10", "NPK 15-15-15"];
const rainingOptions = ["yes", "no"];

function getRandomValue(base, percentage) {
  const variation = base * (percentage / 100);
  return base + (Math.random() * variation * 2 - variation);
}

function getRandomCrop() {
  return crops[Math.floor(Math.random() * crops.length)];
}

function getRandomFertilizer() {
  return fertilizers[Math.floor(Math.random() * fertilizers.length)];
}

function getRandomRaining() {
  return rainingOptions[Math.floor(Math.random() * rainingOptions.length)];
}

function getRandomHarvestableMonths() {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const numMonths = Math.floor(Math.random() * 3) + 1;
  const selectedMonths = [];
  for (let i = 0; i < numMonths; i++) {
    const month = months[Math.floor(Math.random() * months.length)];
    selectedMonths.push({
      month: month,
      wholesale_price: getRandomValue(100, 10),
      retail_price: getRandomValue(150, 10),
    });
  }
  return selectedMonths;
}

function getSequentialDates(start, end, intervalMinutes) {
  const dates = [];
  let currentDate = new Date(start);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes);
  }

  return dates;
}

function postData(date) {
  const testData = {
    time: date.toISOString(),
    temperature: getRandomValue(25, 10),
    humidity: getRandomValue(60, 10),
    aqi: getRandomValue(50, 10),
    hi: getRandomValue(27, 10),
    alt: getRandomValue(100, 10),
    pres: getRandomValue(1013, 10),
    moisture: getRandomValue(30, 10),
    raining: getRandomRaining(),
    wifi_strength: getRandomValue(-50, 10),
    best_crop: getRandomCrop(),
    recommended_fertilizer: getRandomFertilizer(),
    npk_uptake_nitrogen: getRandomValue(10, 10),
    npk_uptake_phosphorus: getRandomValue(5, 10),
    npk_uptake_potassium: getRandomValue(8, 10),
    harvestable_months: getRandomHarvestableMonths(),
  };

  axios
    .post("https://data.cropsense.tech/", testData)
    .then((response) => {
      console.log("Data posted successfully:", response.data);
    })
    .catch((error) => {
      console.error("Error posting data:", error);
    });
}

// Set the start and end times
const startDate = new Date("2025-04-06T00:00:00Z");
const endDate = new Date("2025-05-29T07:30:00Z");
const intervalMinutes = 60; // 10-minute intervals

// Generate the dates
const dates = getSequentialDates(startDate, endDate, intervalMinutes);

let count = 0;
const interval = setInterval(() => {
  if (count >= dates.length) {
    clearInterval(interval);
  } else {
    postData(dates[count]);
    count++;
  }
}, 1000); // Post data every second