#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "🧹 Cleaning previous builds and node_modules..."
rm -rf spa/build spa/node_modules backend/node_modules

echo "📦 Installing frontend (spa) dependencies and building..."
cd spa
npm install
npm run build

echo "📦 Installing backend dependencies..."
cd ../backend
npm install

echo "✅ Setup completed successfully."

