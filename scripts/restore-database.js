// Database restore script
// Works for both SQLite and PostgreSQL

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backupPath = process.argv[2];
const DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';

if (!backupPath) {
  console.error('❌ Please provide backup file path');
  console.log('Usage: node scripts/restore-database.js <backup-file-path>');
  process.exit(1);
}

if (!fs.existsSync(backupPath)) {
  console.error(`❌ Backup file not found: ${backupPath}`);
  process.exit(1);
}

console.log('🔄 Restoring database from backup...\n');
console.log(`📦 Backup file: ${backupPath}\n`);

// Determine database type
const isSQLite = DATABASE_URL.startsWith('file:') || DATABASE_URL.startsWith('sqlite:');
const isPostgreSQL = DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://');

if (isSQLite) {
  // SQLite restore
  const dbPath = DATABASE_URL.replace('file:', '').replace('sqlite:', '');
  const fullDbPath = path.isAbsolute(dbPath) 
    ? dbPath 
    : path.join(process.cwd(), dbPath);
  
  // Create directory if it doesn't exist
  const dbDir = path.dirname(fullDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  try {
    // Backup current database first (if it exists)
    if (fs.existsSync(fullDbPath)) {
      const currentBackup = `${fullDbPath}.before-restore-${Date.now()}`;
      fs.copyFileSync(fullDbPath, currentBackup);
      console.log(`💾 Current database backed up to: ${currentBackup}`);
    }
    
    // Restore from backup
    fs.copyFileSync(backupPath, fullDbPath);
    console.log(`✅ Database restored successfully!`);
    console.log(`   Restored to: ${fullDbPath}`);
  } catch (error) {
    console.error('❌ Error restoring database:', error.message);
    process.exit(1);
  }
} else if (isPostgreSQL) {
  // PostgreSQL restore using pg_restore
  try {
    // Extract connection details from DATABASE_URL
    const url = new URL(DATABASE_URL.replace(/^postgresql:\/\//, 'http://').replace(/^postgres:\/\//, 'http://'));
    const host = url.hostname;
    const port = url.port || 5432;
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;
    
    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = password;
    
    // Drop and recreate database (WARNING: This will delete all data!)
    console.log('⚠️  WARNING: This will DELETE all current data in the database!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    // Wait 5 seconds
    const start = Date.now();
    while (Date.now() - start < 5000) {
      // Wait
    }
    
    // Restore database
    const command = `pg_restore -h ${host} -p ${port} -U ${username} -d ${database} --clean --if-exists "${backupPath}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Database restored successfully!`);
  } catch (error) {
    console.error('❌ Error restoring database:', error.message);
    console.error('   Make sure pg_restore is installed and DATABASE_URL is correct');
    process.exit(1);
  }
} else {
  console.error('❌ Unsupported database type. Only SQLite and PostgreSQL are supported.');
  process.exit(1);
}

console.log('\n✅ Restore complete!');

