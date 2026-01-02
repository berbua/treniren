// Simplified backup script - only backs up essential data
// Usage: DATABASE_URL="postgresql://..." node scripts/backup-simple.js

const fs = require('fs');
const path = require('path');

try {
  require.resolve('@prisma/client');
} catch (e) {
  console.error('❌ Error: Prisma Client not found. Run: npx prisma generate');
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.log('\nUsage:');
  console.log('  export DATABASE_URL="postgresql://user:password@host:port/database"');
  console.log('  node scripts/backup-simple.js');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(backupDir, `simple-backup-${timestamp}.json`);

async function backupDatabase() {
  console.log('📦 Creating simple database backup...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    const backup = {
      timestamp: new Date().toISOString(),
      data: {}
    };

    // Only backup essential tables
    console.log('⏳ Backing up essential data...\n');

    const tables = [
      { name: 'users', model: prisma.user },
      { name: 'workouts', model: prisma.workout },
      { name: 'exercises', model: prisma.exercise },
      { name: 'events', model: prisma.event },
      { name: 'tags', model: prisma.tag },
      { name: 'routines', model: prisma.routine }
    ];

    for (const table of tables) {
      try {
        console.log(`  📋 ${table.name}...`);
        backup.data[table.name] = await table.model.findMany();
        console.log(`     ✅ ${backup.data[table.name].length} records`);
      } catch (error) {
        console.log(`     ⚠️  Error: ${error.message}`);
        backup.data[table.name] = [];
      }
    }

    // Save backup
    console.log('\n💾 Saving backup...');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    const size = (fs.statSync(backupFile).size / 1024).toFixed(2);
    console.log(`✅ Backup created successfully!`);
    console.log(`   File: ${backupFile}`);
    console.log(`   Size: ${size} KB`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('undefined')) {
      console.error('\n💡 Try running: npx prisma generate');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();



