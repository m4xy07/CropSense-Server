#!/usr/bin/env bash

echo "Deploying changes to CropSense Server..."

# Update the public directory to remove any redirects
echo "Updating public directory..."
chmod +x /root/update-public-directory.sh
/root/update-public-directory.sh

# Check if the database has data
echo "Checking database..."
cd /root/CropSense-Server
# node -e "
# const mongoose = require('mongoose');
# mongoose.connect('mongodb://127.0.0.1:27017/weather-data', {
#   useNewUrlParser: true, useUnifiedTopology: true
# }).then(async () => {
#   const count = await mongoose.connection.db.collection('weatherdatas').countDocuments();
#   console.log(\`Database contains \${count} records\`);
#   if (count === 0) {
#     console.log('Database is empty, seeding is recommended');
#     process.exit(1);
#   } else {
#     process.exit(0);
#   }
# }).catch(err => {
#   console.error('Error connecting to database:', err);
#   process.exit(1);
# });"

# if [ $? -ne 0 ]; then
#   echo "Seeding database with sample data..."
#   chmod +x /root/seed-database.sh
#   /root/seed-database.sh
# fi

# Restart the server
echo "Restarting the CropSense service..."
sudo systemctl restart cropsense.service
sleep 2

# Check service status
echo "Checking service status:"
sudo systemctl status cropsense.service --no-pager -l | head -n 20

# Create and run the check script
echo "Creating server response check script..."
chmod +x /root/check-server-response.sh

echo -e "\nChecking server responses:"
/root/check-server-response.sh

echo -e "\nDeployment complete!"
echo "Raw JSON data available at: https://data.cropsense.tech"
echo "Raw JSON data also available at: https://data.cropsense.tech/data"
echo "UI dashboard only available at: https://data.cropsense.tech/ui"
