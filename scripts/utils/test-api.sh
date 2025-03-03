#!/usr/bin/env bash

SERVER_URL="https://data.cropsense.tech"
SAMPLE_DATA='{
  "time": "'"$(date +"%Y-%m-%d %H:%M:%S")"'",
  "temperature": 25.3,
  "humidity": 65.8,
  "aqi": 42,
  "hi": 26.1,
  "alt": 452.6,
  "pres": 1013.25,
  "moisture": 35.4,
  "raining": "no",
  "wifi_strength": -68,
  "best_crop": "tomato",
  "recommended_fertilizer": "NPK 10-5-5",
  "npk_uptake_nitrogen": 80.5,
  "npk_uptake_phosphorus": 45.2,
  "npk_uptake_potassium": 60.7,
  "harvestable_months": [
    {"month": "June", "wholesale_price": 42.50, "retail_price": 65.75},
    {"month": "July", "wholesale_price": 38.25, "retail_price": 59.99}
  ]
}'

echo "Testing API at $SERVER_URL"
echo "-------------------------"

echo "1. Testing root JSON endpoint (/) to verify JSON is returned:"
curl -k -s "$SERVER_URL/" | head -n 10
echo -e "\n[Output truncated...]"

echo -e "\n2. Testing legacy endpoint (/data) to verify JSON is returned:"
curl -k -s "$SERVER_URL/data" | head -n 10
echo -e "\n[Output truncated...]"

echo -e "\n3. Testing UI page is still accessible at /ui:"
curl -k -s -I "$SERVER_URL/ui" | head -n 1

echo -e "\n4. Testing POST to root endpoint (/) with sample data:"
curl -k -X POST "$SERVER_URL/" \
  -H "Content-Type: application/json" \
  -d "$SAMPLE_DATA" \
  -w "\nStatus code: %{http_code}\n"

echo -e "\nTesting complete."
echo "For JSON data: $SERVER_URL"
echo "For UI dashboard: $SERVER_URL/ui"
