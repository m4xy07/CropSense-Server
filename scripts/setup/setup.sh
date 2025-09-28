#!/usr/bin/env bash

echo "Setting up CropSense Server for domain data.cropsense.tech"

# Make sure scripts are executable
chmod +x /root/scripts/ssl/generate-cert.sh
chmod +x /root/scripts/ssl/setup-letsencrypt.sh
chmod +x /root/scripts/setup/configure-firewall.sh
chmod +x /root/scripts/setup/verify-dns.sh
chmod +x /root/create-public-directory.sh
chmod +x /root/test-api.sh

# Check and configure firewall
echo "Checking and configuring firewall..."
/root/scripts/setup/configure-firewall.sh

# Verify DNS configuration
echo "Verifying DNS configuration..."
/root/scripts/setup/verify-dns.sh

# Make sure DNS record points to this server's IP
echo "Please ensure your DNS A record for data.cropsense.tech points to this server's IP address."
read -p "Press Enter to continue..."

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install MongoDB if not already installed
if ! systemctl is-active --quiet mongodb; then
    echo "Installing MongoDB..."
    sudo apt-get install -y mongodb
    sudo systemctl enable mongodb
    sudo systemctl start mongodb
fi

# Create public directory with index.html
echo "Creating public directory and files..."
/root/create-public-directory.sh

# Update public directory with index.html
echo "Updating public directory and files..."
chmod +x /root/update-public-directory.sh
/root/update-public-directory.sh

# Seed the database with sample data
echo "Seeding the database with sample data..."
chmod +x /root/seed-database.sh
/root/seed-database.sh

# Set up Let's Encrypt certificate
echo "Setting up SSL certificate using Let's Encrypt..."
/root/ssl/setup-letsencrypt.sh

# Create systemd service file if it doesn't exist
if [ ! -f "/etc/systemd/system/cropsense.service" ]; then
    echo "Creating systemd service file..."
    cat > /etc/systemd/system/cropsense.service << EOL
[Unit]
Description=CropSense Node.js Server
After=network.target mongodb.service

[Service]
ExecStart=/usr/bin/node /root/CropSense-Server/server.js
WorkingDirectory=/root/CropSense-Server
Restart=always
User=root
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL
fi

# Install required Node.js packages if they don't exist
echo "Installing required Node.js packages..."
cd /root/CropSense-Server
npm install express mongoose body-parser cors

# Reload systemd, enable and start service
echo "Setting up systemd service..."
sudo systemctl daemon-reload
sudo systemctl enable cropsense.service
sudo systemctl restart cropsense.service

# Add a restart command at the end to ensure all changes take effect
echo "Restarting the CropSense server..."
sudo systemctl restart cropsense

echo "Setup complete! Your server should now be running at https://data.cropsense.tech"
echo "UI Dashboard is available at https://data.cropsense.tech/ui"
echo "API Endpoint is available at https://data.cropsense.tech/api/data"
echo "Check status with: sudo systemctl status cropsense.service"
echo "If there are issues, check the logs with: sudo journalctl -u cropsense.service"
echo "You can test the API endpoints using: /root/test-api.sh"
