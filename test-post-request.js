const axios = require("axios");

// Configuration
const API_URL = "http://152.42.247.152/data";
const IST_OFFSET_MINUTES = 330; // UTC+05:30
const REQUEST_DELAY_MS = 250; // throttle between requests to avoid overwhelming the server
const DRY_RUN = process.env.DRY_RUN === "true"; // optional: preview without posting
const LIMIT_N = process.env.LIMIT_N ? parseInt(process.env.LIMIT_N, 10) : null; // optional: cap number of posts

// Pune, Maharashtra context
const PUNE_ALTITUDE_M = 560; // ~560 m AMSL

// Crop windows (simplified for listed crops)
const CROP_SEASONS = {
  // Months are 0-based indices
  rice: { kharif: [6, 7, 8, 9], harvest: [10, 11] }, // sow Jun-Sep, harvest Oct-Nov
  soybean: { kharif: [6, 7, 8, 9], harvest: [9, 10] },
  corn: { summer: [1, 2, 3, 4], harvest: [4, 5, 6] }, // Feb-May sow, harvest May-Jul
  wheat: { rabi: [10, 11, 0], harvest: [1, 2, 3] }, // Nov-Jan grow, harvest Feb-Apr
  barley: { rabi: [10, 11, 0], harvest: [2, 3] },
};

const FERTILIZER_BY_CROP = {
  rice: "NPK 20-20-20",
  soybean: "NPK 15-15-15",
  corn: "NPK 20-20-20",
  wheat: "NPK 10-10-10",
  barley: "NPK 10-10-10",
};

// Utility random helpers
function randRange(min, max) {
  return Math.random() * (max - min) + min;
}
function jitter(value, pct) {
  const variation = value * (pct / 100);
  return value + (Math.random() * 2 - 1) * variation;
}

// Convert UTC Date to IST Date
function toIST(utcDate) {
  const offsetMs = IST_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcDate.getTime() + offsetMs);
}

// Barometric pressure at altitude in hPa using standard atmosphere approximation
function pressureAtAltitude(hMeters) {
  return 1013.25 * Math.pow(1 - 2.25577e-5 * hMeters, 5.25588);
}

// Seasonal parameters for Pune by month index (0=Jan)
function monthlyClimateParams(monthIdx) {
  // Baselines are approximate daily mean temps (C) and RH (%) for Pune
  // and are used as centers for diurnal variation.
  switch (monthIdx) {
    case 0: // Jan
      return { tMean: 22, tAmp: 6, rhMean: 45, rhAmp: 10, rainProb: 0.02, aqiBase: 110 };
    case 1: // Feb
      return { tMean: 24, tAmp: 7, rhMean: 40, rhAmp: 10, rainProb: 0.03, aqiBase: 100 };
    case 2: // Mar
      return { tMean: 28, tAmp: 8, rhMean: 35, rhAmp: 12, rainProb: 0.04, aqiBase: 90 };
    case 3: // Apr
      return { tMean: 31, tAmp: 9, rhMean: 35, rhAmp: 12, rainProb: 0.05, aqiBase: 95 };
    case 4: // May
      return { tMean: 33, tAmp: 10, rhMean: 40, rhAmp: 12, rainProb: 0.08, aqiBase: 100 };
    case 5: // Jun (monsoon starts)
      return { tMean: 29, tAmp: 7, rhMean: 70, rhAmp: 10, rainProb: 0.72, aqiBase: 70 };
    case 6: // Jul (peak monsoon)
      return { tMean: 27, tAmp: 5, rhMean: 80, rhAmp: 8, rainProb: 0.82, aqiBase: 60 };
    case 7: // Aug (strong monsoon)
      return { tMean: 27, tAmp: 5, rhMean: 82, rhAmp: 8, rainProb: 0.76, aqiBase: 60 };
    case 8: // Sep (retreating monsoon)
      return { tMean: 28, tAmp: 6, rhMean: 75, rhAmp: 10, rainProb: 0.58, aqiBase: 65 };
    case 9: // Oct (retreating monsoon)
      return { tMean: 28, tAmp: 8, rhMean: 55, rhAmp: 12, rainProb: 0.57, aqiBase: 80 };
    case 10: // Nov
      return { tMean: 26, tAmp: 7, rhMean: 45, rhAmp: 12, rainProb: 0.06, aqiBase: 90 };
    case 11: // Dec
      return { tMean: 23, tAmp: 6, rhMean: 45, rhAmp: 10, rainProb: 0.03, aqiBase: 100 };
    default:
      return { tMean: 28, tAmp: 7, rhMean: 55, rhAmp: 10, rainProb: 0.1, aqiBase: 85 };
  }
}

// Diurnal sinusoid helper: hour in [0..23]
function diurnal(valueMean, amplitude, hour, phaseShift = -3) {
  // Peak temperature mid-afternoon (~15 IST). phaseShift to align.
  // Use cosine so hour=0 near night low.
  const radians = ((hour + phaseShift) / 24) * 2 * Math.PI;
  return valueMean + amplitude * Math.cos(radians);
}

// Compute Heat Index (HI) in C from T(C) and RH(%); use Rothfusz approximation (valid for T>=26.7C)
function computeHeatIndexC(tempC, rh) {
  const tempF = tempC * 9 / 5 + 32;
  const R = rh;
  // If below threshold, HI ~ T
  if (tempC < 26.7) return tempC;
  const HI_F = -42.379 + 2.04901523 * tempF + 10.14333127 * R - 0.22475541 * tempF * R - 6.83783e-3 * tempF * tempF - 5.481717e-2 * R * R + 1.22874e-3 * tempF * tempF * R + 8.5282e-4 * tempF * R * R - 1.99e-6 * tempF * tempF * R * R;
  return (HI_F - 32) * 5 / 9;
}

function chooseBestCrop(monthIdx) {
  // Seasonal preference for Pune
  if ([6, 7, 8, 9].includes(monthIdx)) return "rice"; // monsoon kharif
  if ([10, 11, 0, 1].includes(monthIdx)) return "wheat"; // rabi
  if ([2, 3, 4].includes(monthIdx)) return "corn"; // summer
  // shoulder months
  return Math.random() < 0.5 ? "soybean" : "barley";
}

function cropHarvestableMonths(crop) {
  const months = [];
  const add = (arr) => arr.forEach((m) => months.push(m));
  const s = CROP_SEASONS[crop];
  if (!s) return ["October"]; // fallback
  const harvest = s.harvest || [];
  harvest.forEach((m) => months.push(monthIndexToName(m)));
  if (months.length === 0) months.push("October");
  return months;
}

function monthIndexToName(idx) {
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return names[idx % 12];
}

function cropPriceRanges(crop) {
  // Rough INR/kg wholesale/retail ranges for context; relative differences matter
  switch (crop) {
    case "rice":
      return { wholesale: [22, 32], retail: [35, 55] };
    case "wheat":
      return { wholesale: [20, 28], retail: [30, 45] };
    case "soybean":
      return { wholesale: [35, 55], retail: [50, 80] };
    case "barley":
      return { wholesale: [18, 26], retail: [28, 42] };
    case "corn":
      return { wholesale: [18, 25], retail: [28, 40] };
    default:
      return { wholesale: [20, 30], retail: [30, 50] };
  }
}

// Legacy seasonal moisture estimate (kept for reference); we use a stateful version below.
function computeMoisture(monthIdx, raining) {
  let base;
  if ([6, 7, 8, 9].includes(monthIdx)) base = randRange(40, 60); // monsoon
  else if ([10, 11, 0].includes(monthIdx)) base = randRange(25, 40); // post-monsoon to winter
  else base = randRange(15, 30); // summer/pre-monsoon
  if (raining === "yes") base += randRange(5, 15);
  return Math.min(80, Math.max(5, base));
}

// Stateful moisture evolution to ensure continuity and realism
function nextMoisture(prevMoisture, monthIdx, raining, temperature, rh) {
  // Seasonal target
  let target;
  if ([6, 7, 8, 9].includes(monthIdx)) target = 55;
  else if ([10, 11, 0].includes(monthIdx)) target = 35;
  else target = 25;

  let moisture = prevMoisture ?? jitter(target, 10);

  // Rain adds, evaporation subtracts (more when hotter and drier)
  if (raining === "yes") moisture += randRange(2, 6);
  const evap = Math.max(0, (temperature - 25) * 0.12) + Math.max(0, (60 - rh) * 0.04);
  moisture -= evap;

  // Pull towards seasonal target a bit
  moisture += (target - moisture) * 0.05;

  return Math.min(85, Math.max(5, moisture));
}

function decideRaining(monthIdx, rh, hour, prevWasRaining) {
  const { rainProb } = monthlyClimateParams(monthIdx);
  // Slightly higher chance late afternoon/evening in monsoon due to convection
  const diurnalBoost = [6, 7, 8, 9].includes(monthIdx) && hour >= 14 && hour <= 21 ? 0.1 : 0;
  const rhBoost = rh > 75 ? 0.05 : 0;
  // Persistence effect: once raining, tends to continue; otherwise slight inertia to start
  const persistence = prevWasRaining ? 0.2 : -0.05;
  const p = Math.max(0.01, Math.min(0.98, rainProb + diurnalBoost + rhBoost + persistence));
  return Math.random() < p ? "yes" : "no";
}

function computeAQI(monthIdx, hour, raining, prevAQI) {
  const { aqiBase } = monthlyClimateParams(monthIdx);
  let aqi = aqiBase;
  if (raining === "yes") aqi -= 20; // washout
  if (hour >= 7 && hour <= 10) aqi += 10; // morning commute
  if (hour >= 18 && hour <= 21) aqi += 8; // evening commute
  if (hour >= 0 && hour <= 4) aqi -= 10; // late night clean air
  aqi = Math.max(20, aqi);
  aqi = jitter(aqi, 10);
  // Smooth with previous hour to avoid abrupt changes
  if (typeof prevAQI === "number") aqi = 0.7 * aqi + 0.3 * prevAQI;
  return aqi;
}

function computeWifiStrength() {
  // Typical indoor/nearby RSSI
  return -1 * Math.round(randRange(48, 72)); // -48 to -72 dBm
}

function computeNPKUptake(crop) {
  // Not exact science; relative differences by crop
  switch (crop) {
    case "rice":
      return { N: randRange(12, 22), P: randRange(5, 10), K: randRange(10, 18) };
    case "wheat":
      return { N: randRange(10, 18), P: randRange(4, 9), K: randRange(8, 14) };
    case "soybean":
      return { N: randRange(8, 16), P: randRange(4, 9), K: randRange(7, 12) };
    case "barley":
      return { N: randRange(8, 14), P: randRange(3, 7), K: randRange(6, 10) };
    case "corn":
      return { N: randRange(14, 24), P: randRange(6, 11), K: randRange(12, 20) };
    default:
      return { N: randRange(8, 20), P: randRange(3, 10), K: randRange(6, 18) };
  }
}

// Track daily state to enforce smoothness and realism across hours of the same day
let currentDayKey = null;
let dayState = null; // { month, tMean, tAmp, rhMean, rhAmp, dailyTempBias, dailyRhBias }
let prevHourState = null; // previous payload for smoothing and persistence

function istDayKey(dateIST) {
  const y = dateIST.getFullYear();
  const m = String(dateIST.getMonth() + 1).padStart(2, "0");
  const d = String(dateIST.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function resetDayState(istDate) {
  const month = istDate.getMonth();
  const { tMean, tAmp, rhMean, rhAmp } = monthlyClimateParams(month);
  const dailyTempBias = randRange(-1.5, 1.5);
  const dailyRhBias = randRange(-5, 5);
  const ampScale = randRange(0.9, 1.15);
  dayState = { month, tMean, tAmp: tAmp * ampScale, rhMean, rhAmp: rhAmp * ampScale, dailyTempBias, dailyRhBias };
  prevHourState = null;
}

function makeTestData(utcDate) {
  const istDate = toIST(utcDate);
  const hour = istDate.getHours();
  const dayKey = istDayKey(istDate);
  if (dayKey !== currentDayKey) {
    currentDayKey = dayKey;
    resetDayState(istDate);
  }

  const { month, tMean, tAmp, rhMean, rhAmp, dailyTempBias, dailyRhBias } = dayState;

  // Temperature: diurnal + daily bias, then lightly smoothed with previous hour
  let tempDiurnal = diurnal(tMean + dailyTempBias, tAmp, hour);
  let temperature = jitter(tempDiurnal, 2.0);
  if (prevHourState) temperature = 0.8 * temperature + 0.2 * prevHourState.temperature;

  // Humidity inversely related diurnally + daily bias, also smoothed
  let rhDiurnal = diurnal(rhMean + dailyRhBias, rhAmp, 24 - hour, 0);
  let humidity = Math.max(25, Math.min(98, jitter(rhDiurnal, 5)));
  if (prevHourState) humidity = 0.8 * humidity + 0.2 * prevHourState.humidity;

  // Rain decision with persistence
  const prevWasRaining = prevHourState?.raining === "yes";
  const raining = decideRaining(month, humidity, hour, prevWasRaining);

  // AQI influenced by raining/time and smoothed with previous
  const aqi = computeAQI(month, hour, raining, prevHourState?.aqi);

  // Pressure around altitude baseline
  const alt = jitter(PUNE_ALTITUDE_M, 0.8);
  const pres = jitter(pressureAtAltitude(PUNE_ALTITUDE_M), 1.2);

  // Stateful soil moisture
  const moisture = nextMoisture(prevHourState?.moisture, month, raining, temperature, humidity);

  const wifi_strength = computeWifiStrength();

  // Crops and prices
  const best_crop = chooseBestCrop(month);
  const recommended_fertilizer = FERTILIZER_BY_CROP[best_crop] || "NPK 15-15-15";
  const npk = computeNPKUptake(best_crop);
  const harvestMonths = cropHarvestableMonths(best_crop);
  const priceRanges = cropPriceRanges(best_crop);
  const harvestable_months = harvestMonths.map((m) => ({
    month: m,
    wholesale_price: randRange(priceRanges.wholesale[0], priceRanges.wholesale[1]),
    retail_price: randRange(priceRanges.retail[0], priceRanges.retail[1]),
  }));

  const hi = computeHeatIndexC(temperature, humidity);

  const payload = {
    time: utcDate.toISOString(),
    temperature,
    humidity,
    aqi,
    hi,
    alt,
    pres,
    moisture,
    raining,
    wifi_strength,
    best_crop,
    recommended_fertilizer,
    npk_uptake_nitrogen: npk.N,
    npk_uptake_phosphorus: npk.P,
    npk_uptake_potassium: npk.K,
    harvestable_months,
  };

  prevHourState = { ...payload };
  return payload;
}

// Generate exactly one reading per IST hour (24/day) from 2025-07-01 00:00 IST to the last completed IST hour
function generateISTHourlyTimestamps() {
  const offsetMs = IST_OFFSET_MINUTES * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  // Start at 2025-07-01 00:00 IST
  const startISTClockMs = Date.UTC(2025, 6, 1, 0, 0, 0, 0);
  // End at last completed IST hour
  const now = new Date(Date.now() + offsetMs);
  now.setMinutes(0, 0, 0);
  const endISTClockMs = now.getTime();

  const dates = [];
  for (let istMs = startISTClockMs; istMs <= endISTClockMs; istMs += hourMs) {
    // Randomize minutes and seconds within the hour
    let minute = Math.floor(Math.random() * 60);
    let second = Math.floor(Math.random() * 60);
    let candidateIstMs = istMs + minute * 60_000 + second * 1_000;
    // Clamp if beyond boundary
    if (candidateIstMs > endISTClockMs) {
      candidateIstMs = Math.min(endISTClockMs, istMs + 59 * 60_000 + 59 * 1_000);
    }
    const utcMs = candidateIstMs - offsetMs;
    dates.push(new Date(utcMs));
  }
  return dates;
}

async function postAll() {
  const timestamps = generateISTHourlyTimestamps();
  const total = LIMIT_N ? Math.min(LIMIT_N, timestamps.length) : timestamps.length;
  console.log(`Prepared ${total}/${timestamps.length} readings from 2025-07-01 00:00 IST to now (IST).`);

  let success = 0;
  let failed = 0;
  for (let i = 0; i < total; i++) {
    const dt = timestamps[i];
    const payload = makeTestData(dt);
    try {
      if (DRY_RUN) {
        success++;
        if (i < 3 || i % 200 === 0) console.log(`[DRY_RUN ${i + 1}/${total}]`, payload);
      } else {
        const res = await axios.post(API_URL, payload);
        success++;
        if (i % 50 === 0) {
          console.log(`[${i + 1}/${total}] Posted time=${payload.time} -> status=${res.status}`);
        }
      }
    } catch (error) {
      failed++;
      const status = error?.response?.status;
      const msg = status ? `HTTP ${status}` : (error?.message || "Unknown error");
      console.error(`[${i + 1}/${total}] Error posting time=${payload.time}: ${msg}`);
    }
    // Throttle between requests
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  }

  console.log(`Done. Success=${success}, Failed=${failed}.`);
}

// Run when this file is executed directly
if (require.main === module) {
  postAll();
}
