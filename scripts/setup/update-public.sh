#!/usr/bin/env bash

# Create or update public directory
mkdir -p /root/CropSense-Server/public

# Remove any existing index.html file that might redirect
rm -f /root/CropSense-Server/public/index.html

# Create a simple empty favicon to prevent 404 errors
touch /root/CropSense-Server/public/favicon.ico

echo "Public directory updated to prevent any automatic redirects."
