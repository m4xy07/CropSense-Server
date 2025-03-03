#!/usr/bin/env bash

# Change to the project root directory
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

echo "CropSense Server Log Viewer"
echo "=========================="

# Command line arguments
LINES=50
FOLLOW=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -f|--follow) FOLLOW=true ;;
        -n|--lines) LINES="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# View logs based on arguments
if $FOLLOW; then
    echo "Showing last $LINES lines and following new entries. Press Ctrl+C to exit."
    sudo journalctl -u cropsense -n "$LINES" -f
else
    echo "Showing last $LINES lines of logs:"
    sudo journalctl -u cropsense -n "$LINES"
    
    echo -e "\nTo follow logs in real-time, use: $0 --follow"
fi
