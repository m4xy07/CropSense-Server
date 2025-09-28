#!/usr/bin/env bash


# Update package lists and install certbot with fix for missing packages
sudo apt-get update
sudo apt-get install -y --fix-missing certbot

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Error: certbot could not be installed. Please check your package sources and network."
    exit 1
fi


# Ensure ports are open in firewall
sudo bash ../setup/firewall.sh


# Verify DNS settings before proceeding
sudo bash ../setup/verify-dns.sh

echo "Would you like to proceed with certificate setup? (y/n)"
read -r proceed
if [[ ! "$proceed" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Certificate setup aborted."
    exit 1
fi

# Make sure any processes using port 80 are stopped
echo "Stopping any services that might be using port 80..."
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl stop apache2 2>/dev/null || true
sudo systemctl stop cropsense 2>/dev/null || true

# Try to ensure port 80 is free
PORT_80_PROCESS=$(sudo lsof -i :80 | grep LISTEN | awk '{print $2}' | head -n1)
if [ ! -z "$PORT_80_PROCESS" ]; then
    echo "Found process using port 80 (PID: $PORT_80_PROCESS). Attempting to stop it..."
    sudo kill $PORT_80_PROCESS
    sleep 2
fi

# Try using the standalone mode with explicit port specification
echo "Attempting to get certificate using standalone mode..."
sudo certbot certonly --standalone --preferred-challenges http --http-01-port 80 -d data.cropsense.tech

# Check if certificate was successfully obtained
if [ -d /etc/letsencrypt/live/data.cropsense.tech ]; then
    echo "Certificate successfully obtained!"
    
    # Create symbolic links to the certificates in your SSL directory
    sudo mkdir -p /root/ssl
    sudo ln -sf /etc/letsencrypt/live/data.cropsense.tech/privkey.pem /root/ssl/server.key
    sudo ln -sf /etc/letsencrypt/live/data.cropsense.tech/fullchain.pem /root/ssl/server.crt
    
    echo "Certificate has been linked to /root/ssl/"
    
    # Set up auto-renewal
    echo "Setting up automatic renewal..."
    (crontab -l 2>/dev/null; echo "0 0 * * * sudo certbot renew --quiet") | crontab -
    
    echo "Your SSL certificate has been set up successfully!"
else
    echo "Failed to obtain certificate. Falling back to self-signed certificate."
    # Generate self-signed certificate as fallback
    bash ../ssl/generate-cert.sh
    echo "Self-signed certificate has been generated. Note that browsers will show a warning for self-signed certificates."
fi


