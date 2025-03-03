#!/usr/bin/env bash

echo "Checking if UFW (Uncomplicated Firewall) is installed..."
if ! command -v ufw &> /dev/null; then
    echo "Installing UFW..."
    sudo apt-get update
    sudo apt-get install -y ufw
fi

echo "Configuring firewall to allow HTTP and HTTPS traffic..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # Ensure SSH remains accessible

echo "Current UFW rules:"
sudo ufw status

# If UFW is inactive, offer to enable it
if [[ $(sudo ufw status) == *"inactive"* ]]; then
    echo "UFW is inactive. Would you like to enable it? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        sudo ufw --force enable
        echo "UFW has been enabled."
    else
        echo "UFW remains disabled."
    fi
fi

echo "Checking other firewall tools..."
if command -v iptables &> /dev/null; then
    echo "Current iptables rules:"
    sudo iptables -L
    
    # Ensure ports 80 and 443 are allowed in iptables
    echo "Adding rules to iptables to allow ports 80 and 443 if needed..."
    sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
fi

echo "Firewall configuration complete!"
