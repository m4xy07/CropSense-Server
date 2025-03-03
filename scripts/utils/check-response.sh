#!/usr/bin/env bash

SERVER_URL="https://data.cropsense.tech"

echo "Checking response format from $SERVER_URL"
echo "----------------------------------------"

# Check root path with browser-like headers
echo "1. Root path (/) with browser headers:"
CONTENT_TYPE=$(curl -k -s -I -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0" "$SERVER_URL/" | grep -i "Content-Type")
echo "$CONTENT_TYPE"

# Check /data path with browser-like headers
echo "2. Data path (/data) with browser headers:"
CONTENT_TYPE=$(curl -k -s -I -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0" "$SERVER_URL/data" | grep -i "Content-Type")
echo "$CONTENT_TYPE"

# Check /ui path to make sure it's HTML
echo "3. UI path (/ui) with browser headers:"
CONTENT_TYPE=$(curl -k -s -I -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0" "$SERVER_URL/ui" | grep -i "Content-Type")
echo "$CONTENT_TYPE"

# Check API endpoint
echo "4. API path (/api/data) with browser headers:"
CONTENT_TYPE=$(curl -k -s -I -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0" "$SERVER_URL/api/data" | grep -i "Content-Type")
echo "$CONTENT_TYPE"

# Sample data to verify responses
echo -e "\nSample response from root path (/):"
curl -k -s "$SERVER_URL/" | head -n 10
echo -e "\n[Output truncated...]"

echo -e "\nSample response from data path (/data):"
curl -k -s "$SERVER_URL/data" | head -n 10
echo -e "\n[Output truncated...]"

echo -e "\nVerification complete."
echo "- Root path (/) should return raw JSON even in browsers"
echo "- Data path (/data) should return raw JSON even in browsers"
echo "- Only /ui should show the HTML dashboard"
