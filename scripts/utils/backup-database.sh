#!/usr/bin/env bash

# Change to the project root directory
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

# Create backups directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/backups"

# Generate timestamp for the backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$PROJECT_ROOT/backups/weather-data_$TIMESTAMP.gz"

echo "Backing up MongoDB database to $BACKUP_FILE..."

# Perform the backup using mongodump
if command -v mongodump &> /dev/null; then
    mongodump --db weather-data --archive="$BACKUP_FILE" --gzip
    
    # Check if backup was successful
    if [ $? -eq 0 ]; then
        echo "Backup completed successfully!"
        echo "Backup location: $BACKUP_FILE"
        
        # List recent backups
        echo "Recent backups:"
        ls -la "$PROJECT_ROOT/backups" | tail -n 5
    else
        echo "Backup failed. Please check MongoDB connection and permissions."
    fi
else
    echo "Error: mongodump command not found. Please install MongoDB tools."
    exit 1
fi

# Clean up old backups (keep only the 10 most recent)
echo "Cleaning up old backups..."
ls -t "$PROJECT_ROOT/backups" | tail -n +11 | xargs -I {} rm "$PROJECT_ROOT/backups/{}"

echo "Backup process complete."
