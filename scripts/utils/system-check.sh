#!/usr/bin/env bash

# Change to the project root directory
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

echo "CropSense Server System Check"
echo "============================"

# Check Node.js installation
echo -n "Node.js: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Installed ($NODE_VERSION)"
else
    echo "❌ Not installed"
fi

# Check npm installation
echo -n "npm: "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ Installed ($NPM_VERSION)"
else
    echo "❌ Not installed"
fi

# Check MongoDB installation and status
echo -n "MongoDB: "
if command -v mongod &> /dev/null; then
    echo "✅ Installed"
    
    # Check if MongoDB is running
    if systemctl is-active --quiet mongodb; then
        echo "MongoDB service: ✅ Running"
    else
        echo "MongoDB service: ❌ Not running"
    fi
    
    # Check DB connection and content
    if command -v mongo &> /dev/null; then
        DB_COUNT=$(mongo --quiet --eval "db.getSiblingDB('weather-data').weatherdatas.countDocuments({})" 2>/dev/null || echo "Error")
        if [[ "$DB_COUNT" == "Error" ]]; then
            echo "Database connection: ❌ Failed"
        else
            echo "Database records: $DB_COUNT"
        fi
    fi
else
    echo "❌ Not installed"
fi

# Check disk space
echo -n "Disk space: "
df -h / | awk 'NR==2 {print $4 " available out of " $2 " (" $5 " used)"}'

# Check memory usage
echo -n "Memory usage: "
free -h | awk 'NR==2 {print $3 " used out of " $2 " (" $3/$2*100 "% used)"}'

# Check if SSL certificates exist
echo -n "SSL certificates: "
if [[ -f "$PROJECT_ROOT/ssl/server.key" && -f "$PROJECT_ROOT/ssl/server.crt" ]]; then
    echo "✅ Found"
    
    # Check certificate expiration
    if command -v openssl &> /dev/null; then
        EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$PROJECT_ROOT/ssl/server.crt" | cut -d= -f2)
        echo "Certificate expiry: $EXPIRY_DATE"
    fi
else
    echo "❌ Missing"
fi

# Check if server.js exists
echo -n "Server.js: "
if [[ -f "$PROJECT_ROOT/server.js" ]]; then
    echo "✅ Found"
else
    echo "❌ Missing"
fi

# Check if service is configured and running
echo -n "SystemD service: "
if systemctl list-unit-files | grep -q cropsense.service; then
    echo "✅ Configured"
    
    if systemctl is-active --quiet cropsense.service; then
        echo "Service status: ✅ Running"
    else
        echo "Service status: ❌ Not running"
    fi
else
    echo "❌ Not configured"
fi

echo -e "\nFirewall status:"
sudo ufw status | head -n 5

echo -e "\nSystem check complete."
