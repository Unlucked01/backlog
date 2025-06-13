#!/bin/bash

# Update Docker Compose to fix ContainerConfig error
# This script updates Docker Compose to a newer version

set -e

echo "🔄 Updating Docker Compose to fix ContainerConfig error..."

# Check current version
echo "📋 Current Docker Compose version:"
docker-compose --version

# Download and install latest Docker Compose
echo "📥 Downloading latest Docker Compose..."

# Get latest version
LATEST_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
echo "Latest version: $LATEST_VERSION"

# Download binary
sudo curl -L "https://github.com/docker/compose/releases/download/$LATEST_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Create symlink if needed
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

echo "✅ Docker Compose updated successfully!"

# Check new version
echo "📋 New Docker Compose version:"
docker-compose --version

echo ""
echo "🎉 Docker Compose update complete!"
echo "You can now try running your docker-compose commands again."
echo ""
echo "💡 If you still have issues, run: ./scripts/fix-docker.sh" 