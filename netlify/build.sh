#!/bin/bash

# תסריט בנייה מותאם לנטליפיי
echo "Starting custom build process for Netlify..."

# התקנת חבילות נדרשות
npm install

# וודא שתיקיית הפלט קיימת
echo "Creating output directory..."
mkdir -p dist/public

# בניית קובצי הקליינט בלבד (ללא בניית השרת)
echo "Building client files..."
npx vite build

echo "Listing files in dist directory:"
ls -la dist
ls -la dist/public

echo "Build completed successfully!"