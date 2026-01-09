#!/bin/bash

# Script to clear Next.js and Turbopack caches
# This fixes chunk loading errors in development

echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo "🧹 Clearing node_modules/.cache..."
rm -rf node_modules/.cache

echo "🧹 Clearing Turbopack cache..."
rm -rf .turbo

echo "✅ Cache cleared! Now restart your dev server with: npm run dev"
