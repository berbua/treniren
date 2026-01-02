// Database backup script
// Works for both SQLite and PostgreSQL

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';

console.log('📦 Creating database backup...\n');

// Determine database type
const isSQLite = DATABASE_URL.startsWith('file:') || DATABASE_URL.startsWith('sqlite:');
const isPostgreSQL = DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://');

// Create backup directory
const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
let backupPath;

if (isSQLite) {
  // SQLite backup
  const dbPath = DATABASE_URL.replace('file:', '').replace('sqlite:', '');
  const fullDbPath = path.isAbsolute(dbPath) 
    ? dbPath 
    : path.join(process.cwd(), dbPath);
  
  if (!fs.existsSync(fullDbPath)) {
    console.error(`❌ Database file not found: ${fullDbPath}`);
    process.exit(1);
  }
  
  backupPath = path.join(backupDir, `backup-${timestamp}.db`);
  
  try {
    fs.copyFileSync(fullDbPath, backupPath);
    console.log(`✅ SQLite backup created: ${backupPath}`);
    console.log(`   Original: ${fullDbPath}`);
    console.log(`   Backup size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    process.exit(1);
  }
} else if (isPostgreSQL) {
  // PostgreSQL backup using pg_dump
  backupPath = path.join(backupDir, `backup-${timestamp}.sql`);
  
  try {
    // Extract connection details from DATABASE_URL
    const url = new URL(DATABASE_URL.replace(/^postgresql:\/\//, 'http://').replace(/^postgres:\/\//, 'http://'));
    const host = url.hostname;
    const port = url.port || 5432;
    const database = url.pathname.slice(1); // Remove leading /
    const username = url.username;
    const password = url.password;
    
    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = password;
    
    // Run pg_dump
    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f "${backupPath}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ PostgreSQL backup created: ${backupPath}`);
    console.log(`   Database: ${database}@${host}:${port}`);
    console.log(`   Backup size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Error creating PostgreSQL backup:', error.message);
    console.error('   Make sure pg_dump is installed and DATABASE_URL is correct');
    process.exit(1);
  }
} else {
  console.error('❌ Unsupported database type. Only SQLite and PostgreSQL are supported.');
  process.exit(1);
}

console.log(`\n💾 Backup saved to: ${backupPath}`);
console.log(`\n📝 To restore this backup later, run:`);
if (isSQLite) {
  console.log(`   cp "${backupPath}" "${DATABASE_URL.replace('file:', '').replace('sqlite:', '')}"`);
} else {
  console.log(`   pg_restore -h <host> -p <port> -U <user> -d <database> "${backupPath}"`);
}

