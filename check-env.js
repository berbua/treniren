#!/usr/bin/env node

/**
 * Quick script to check if NEXTAUTH_URL is set correctly
 * Run: node check-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking NextAuth Configuration...\n');

// Check for .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

let envContent = '';

if (fs.existsSync(envLocalPath)) {
  console.log('✅ Found .env.local');
  envContent = fs.readFileSync(envLocalPath, 'utf8');
} else if (fs.existsSync(envPath)) {
  console.log('⚠️  Found .env (but not .env.local - .env.local takes precedence)');
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.log('❌ No .env.local or .env file found!');
  console.log('\n📝 Create .env.local with:');
  console.log('   NEXTAUTH_URL="http://YOUR_IP:2137"');
  process.exit(1);
}

// Check for NEXTAUTH_URL
const nextAuthUrlMatch = envContent.match(/NEXTAUTH_URL=["']?([^"'\n]+)["']?/);
if (nextAuthUrlMatch) {
  const url = nextAuthUrlMatch[1];
  console.log(`✅ NEXTAUTH_URL is set: ${url}`);
  
  if (url.includes('localhost') && !url.includes('192.168')) {
    console.log('\n⚠️  WARNING: NEXTAUTH_URL uses localhost');
    console.log('   For mobile testing, use your local IP address:');
    console.log('   NEXTAUTH_URL="http://192.168.1.12:2137"');
    console.log('\n   Find your IP with:');
    console.log('   macOS: ifconfig | grep "inet " | grep -v 127.0.0.1');
    console.log('   Linux: hostname -I');
  } else if (url.includes('192.168') || url.includes('10.') || url.includes('172.')) {
    console.log('✅ Using local network IP - good for mobile testing!');
  }
} else {
  console.log('❌ NEXTAUTH_URL is NOT set in .env.local');
  console.log('\n📝 Add this to .env.local:');
  console.log('   NEXTAUTH_URL="http://YOUR_IP:2137"');
  process.exit(1);
}

// Check for NEXTAUTH_SECRET
const secretMatch = envContent.match(/NEXTAUTH_SECRET=["']?([^"'\n]+)["']?/);
if (secretMatch) {
  console.log('✅ NEXTAUTH_SECRET is set');
} else {
  console.log('⚠️  NEXTAUTH_SECRET is not set (required for production)');
}

// Check for Google OAuth
const googleClientIdMatch = envContent.match(/GOOGLE_CLIENT_ID=["']?([^"'\n]+)["']?/);
if (googleClientIdMatch) {
  console.log('✅ GOOGLE_CLIENT_ID is set');
} else {
  console.log('⚠️  GOOGLE_CLIENT_ID is not set (Google login won\'t work)');
}

console.log('\n💡 Remember to restart your dev server after changing .env.local!');
console.log('   npm run dev\n');


