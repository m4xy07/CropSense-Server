<<<<<<< HEAD
# CropSense Server

## Directory Structure

```
CropSense-Server/
├── config/            # Configuration files
├── public/            # Static web files
├── scripts/           # Scripts for setup and maintenance
│   ├── setup/         # Setup scripts
│   ├── ssl/           # SSL certificate management
│   └── utils/         # Utility scripts
├── ssl/               # SSL certificate files
├── server.js          # Main server application
├── setup.sh           # Main setup script
└── deploy.sh          # Deployment script
```

## Quick Start Guide

### Initial Setup

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh
```

This will:
- Configure firewall
- Verify DNS settings
- Install dependencies
- Set up SSL certificates
- Configure and start the server

### Deploying Updates

```bash
# Deploy changes after modifying server.js
./deploy.sh
```

### Testing API

```bash
# Test API endpoints
./scripts/utils/test-api.sh
```

### Checking Server Response

```bash
# Verify proper content types
./scripts/utils/check-response.sh
```

### Managing the Server

- Start: `sudo systemctl start cropsense`
- Stop: `sudo systemctl stop cropsense`
- Restart: `sudo systemctl restart cropsense`
- Status: `sudo systemctl status cropsense`
- Logs: `sudo journalctl -u cropsense -f`

## API Endpoints

- `GET /` - Get all weather data (JSON)
- `POST /` - Submit new weather data
- `GET /ui` - Web dashboard
