#!/bin/bash

echo "============================================"
echo " Wrath and Glory Character Creator - Setup"
echo "============================================"
echo

# Change to script directory
cd "$(dirname "$0")"

# Check for Node.js
echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo
    echo "Please install Node.js:"
    echo "  - macOS: brew install node"
    echo "  - Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  - Or download from: https://nodejs.org/"
    echo
    echo "Recommended version: 18.x LTS or newer"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "[OK] Node.js found: $NODE_VERSION"

# Check Node version is at least 18
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "[WARNING] Node.js version 18 or higher is recommended."
    echo "          Current version: $NODE_VERSION"
    echo
fi

# Check for npm
echo "Checking for npm..."
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed or not in PATH."
    echo "        npm should be installed with Node.js."
    echo "        Please reinstall Node.js."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "[OK] npm found: v$NPM_VERSION"
echo

# Check for package.json
if [ ! -f "package.json" ]; then
    echo "[ERROR] package.json not found in current directory."
    echo "        Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "============================================"
echo " Installing dependencies..."
echo "============================================"
echo

npm install
if [ $? -ne 0 ]; then
    echo
    echo "[ERROR] npm install failed!"
    echo
    echo "Common solutions:"
    echo "  1. Delete node_modules folder and try again"
    echo "  2. Delete package-lock.json and try again"
    echo "  3. Run 'npm cache clean --force' and try again"
    echo "  4. Check your internet connection"
    exit 1
fi

echo
echo "============================================"
echo " Verifying installation..."
echo "============================================"
echo

# Check if electron was installed
if [ -d "node_modules/electron" ]; then
    echo "[OK] Electron installed"
else
    echo "[WARNING] Electron not found in node_modules"
fi

# Check if electron-builder was installed
if [ -d "node_modules/electron-builder" ]; then
    echo "[OK] Electron Builder installed"
else
    echo "[WARNING] Electron Builder not found in node_modules"
fi

echo
echo "============================================"
echo " Setup Complete!"
echo "============================================"
echo
echo "Available commands:"
echo "  npm start     - Run the application in development mode"
echo "  npm run build - Build executable (outputs to dist/)"
echo
