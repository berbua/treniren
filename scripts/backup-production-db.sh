#!/bin/bash
# Backup script for production PostgreSQL database
# Usage: ./scripts/backup-production-db.sh

set -e

echo "📦 Creating production database backup..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it before running:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo "  ./scripts/backup-production-db.sh"
    exit 1
fi

# Check if it's PostgreSQL
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]] && [[ ! "$DATABASE_URL" =~ ^postgres:// ]]; then
    echo "❌ Error: This script is for PostgreSQL databases only"
    echo "   Current DATABASE_URL doesn't look like PostgreSQL"
    exit 1
fi

# Create backup directory
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/production-backup-$TIMESTAMP.sql"

echo "🔍 Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/g')"
echo "📁 Backup file: $BACKUP_FILE"
echo ""

# Run pg_dump
echo "⏳ Creating backup..."
pg_dump "$DATABASE_URL" -F c -f "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $SIZE"
    echo ""
    echo "📝 To restore this backup:"
    echo "   pg_restore -d \$DATABASE_URL $BACKUP_FILE"
else
    echo "❌ Backup failed!"
    exit 1
fi

