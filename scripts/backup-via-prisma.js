// Backup production database using Prisma (no pg_dump required)
// Usage: DATABASE_URL="postgresql://..." node scripts/backup-via-prisma.js

const fs = require('fs');
const path = require('path');

// Check if Prisma Client is generated
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
  console.log('  node scripts/backup-via-prisma.js');
  process.exit(1);
}

if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ Error: This script is for PostgreSQL databases only');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// Create backup directory
const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(backupDir, `production-backup-prisma-${timestamp}.json`);

async function backupDatabase() {
  console.log('📦 Creating production database backup via Prisma...\n');
  console.log(`🔍 Database: ${DATABASE_URL.replace(/:[^:]*@/, ':***@')}\n`);

  try {
    // Test connection first
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    // Backup all tables
    console.log('⏳ Backing up tables...\n');

    // Users
    console.log('  📋 Users...');
    try {
      backup.data.users = await prisma.user.findMany({
        include: {
          accounts: true,
          sessions: true,
          profile: true
        }
      });
      console.log(`     ✅ ${backup.data.users.length} users`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.users = [];
    }

    // Workouts
    console.log('  📋 Workouts...');
    try {
      backup.data.workouts = await prisma.workout.findMany({
        include: {
          workoutExercises: {
            include: {
              sets: true
            }
          },
          workoutTags: true,
          fingerboardHangs: true
        }
      });
      console.log(`     ✅ ${backup.data.workouts.length} workouts`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.workouts = [];
    }

    // Exercises
    console.log('  📋 Exercises...');
    try {
      backup.data.exercises = await prisma.exercise.findMany();
      console.log(`     ✅ ${backup.data.exercises.length} exercises`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.exercises = [];
    }

    // Events
    console.log('  📋 Events...');
    try {
      backup.data.events = await prisma.event.findMany({
        include: {
          eventTags: true
        }
      });
      console.log(`     ✅ ${backup.data.events.length} events`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.events = [];
    }

    // Tags
    console.log('  📋 Tags...');
    try {
      backup.data.tags = await prisma.tag.findMany();
      console.log(`     ✅ ${backup.data.tags.length} tags`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.tags = [];
    }

    // Routines
    console.log('  📋 Routines...');
    try {
      backup.data.routines = await prisma.routine.findMany({
        include: {
          routineExercises: true,
          variations: true
        }
      });
      console.log(`     ✅ ${backup.data.routines.length} routines`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.routines = [];
    }

    // Plans
    console.log('  📋 Plans...');
    try {
      backup.data.plans = await prisma.plan.findMany({
        include: {
          planTags: true
        }
      });
      console.log(`     ✅ ${backup.data.plans.length} plans`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.plans = [];
    }

    // Fingerboard Protocols
    console.log('  📋 Fingerboard Protocols...');
    try {
      backup.data.fingerboardProtocols = await prisma.fingerboardProtocol.findMany({
        include: {
          hangs: true
        }
      });
      console.log(`     ✅ ${backup.data.fingerboardProtocols.length} protocols`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.fingerboardProtocols = [];
    }

    // Fingerboard Testing Protocols
    console.log('  📋 Fingerboard Testing Protocols...');
    try {
      backup.data.fingerboardTestingProtocols = await prisma.fingerboardTestingProtocol.findMany({
        include: {
          testHangs: true
        }
      });
      console.log(`     ✅ ${backup.data.fingerboardTestingProtocols.length} testing protocols`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.fingerboardTestingProtocols = [];
    }

    // Fingerboard Test Results
    console.log('  📋 Fingerboard Test Results...');
    try {
      backup.data.fingerboardTestResults = await prisma.fingerboardTestResult.findMany();
      console.log(`     ✅ ${backup.data.fingerboardTestResults.length} test results`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message}`);
      backup.data.fingerboardTestResults = [];
    }

    // Push Subscriptions
    console.log('  📋 Push Subscriptions...');
    try {
      backup.data.pushSubscriptions = await prisma.pushSubscription.findMany();
      console.log(`     ✅ ${backup.data.pushSubscriptions.length} push subscriptions`);
    } catch (error) {
      console.log(`     ⚠️  Error: ${error.message} (table might not exist yet)`);
      backup.data.pushSubscriptions = [];
    }

    // Save backup
    console.log('\n💾 Saving backup...');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    const size = (fs.statSync(backupFile).size / 1024).toFixed(2);
    console.log(`✅ Backup created successfully!`);
    console.log(`   File: ${backupFile}`);
    console.log(`   Size: ${size} KB`);
    console.log(`\n📊 Backup summary:`);
    console.log(`   Users: ${backup.data.users.length}`);
    console.log(`   Workouts: ${backup.data.workouts.length}`);
    console.log(`   Exercises: ${backup.data.exercises.length}`);
    console.log(`   Events: ${backup.data.events.length}`);
    console.log(`   Tags: ${backup.data.tags.length}`);
    console.log(`   Routines: ${backup.data.routines.length}`);
    console.log(`   Plans: ${backup.data.plans.length}`);

  } catch (error) {
    console.error('\n❌ Error creating backup:', error.message);
    if (error.message.includes('undefined')) {
      console.error('\n💡 Possible causes:');
      console.error('   1. Prisma Client not generated - run: npx prisma generate');
      console.error('   2. DATABASE_URL is incorrect or database is not accessible');
      console.error('   3. Database schema mismatch - run: npx prisma db push');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();

