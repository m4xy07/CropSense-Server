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

function postData() {
  const currentTime = new Date().toISOString();
  const testData = {
    time: currentTime,
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
    harvestable_months: [
      {
        month: "October",
        wholesale_price: getRandomValue(100, 10),
        retail_price: getRandomValue(150, 10),
      },
    ],
  };

  axios
    .post("http://152.42.247.152/data", testData)
    .then((response) => {
      console.log("Data posted successfully:", response.data);
    })
    .catch((error) => {
      console.error("Error posting data:", error);
    });
}

let count = 0;
const interval = setInterval(() => {
  if (count >= 50) {
    clearInterval(interval);
  } else {
    postData();
    count++;
  }
}, 1000);