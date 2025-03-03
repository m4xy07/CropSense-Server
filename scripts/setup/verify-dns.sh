#!/usr/bin/env bash

DOMAIN="data.cropsense.tech"
SERVER_IP=$(curl -s ifconfig.me)

echo "Checking DNS configuration for $DOMAIN"
echo "This server's IP address: $SERVER_IP"

# Check if DNS resolves to the correct IP
RESOLVED_IP=$(dig +short $DOMAIN)

echo "DNS lookup for $DOMAIN resolves to: $RESOLVED_IP"

if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo "✅ DNS is correctly configured!"
else
    echo "❌ DNS is NOT correctly configured!"
    echo "The domain $DOMAIN resolves to $RESOLVED_IP, but this server's IP is $SERVER_IP"
    echo "Please update your DNS A record for $DOMAIN to point to $SERVER_IP"
    echo "After updating DNS, it may take up to 24-48 hours to propagate completely."
fi

# Check port connectivity
echo "Testing HTTP connectivity to port 80..."
curl -sI http://$SERVER_IP:80 || echo "❌ Cannot connect to port 80 on $SERVER_IP"

echo "Testing HTTPS connectivity to port 443..."
curl -sI --insecure https://$SERVER_IP:443 || echo "❌ Cannot connect to port 443 on $SERVER_IP"

echo "If any tests failed, check your firewall settings and network configuration."
