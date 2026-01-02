# 💾 Database Backup Guide

## ⚠️ Ważne: `prisma db push` NIE usuwa danych!

`prisma db push` **tylko dodaje nową tabelę** (`push_subscriptions`). **NIE usuwa** istniejących danych. 

Ale dla bezpieczeństwa, zawsze warto zrobić backup przed zmianami w bazie danych.

## 🔍 Która baza danych?

- **Lokalna (dev)**: SQLite - plik `prisma/dev.db` - używana podczas developmentu
- **Produkcyjna**: PostgreSQL - na Vercel/Supabase/Neon - używana w produkcji

**Uwaga**: Backup wykonany przez `npm run backup-db` to backup **lokalnej** bazy, nie produkcyjnej!

## 🔄 Szybki Backup (SQLite)

Jeśli używasz SQLite lokalnie (plik `dev.db`):

```bash
# Backup
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)

# Przywrócenie (jeśli coś pójdzie nie tak)
cp prisma/dev.db.backup-YYYYMMDD-HHMMSS prisma/dev.db
```

## 📦 Automatyczny Backup

### Lokalna baza (SQLite)

```bash
# Backup lokalnej bazy
npm run backup-db

# Backup zostanie zapisany w folderze backups/
# np. backups/backup-2025-12-30T14-30-00.db
```

### Produkcyjna baza (PostgreSQL)

**Opcja 1: Przez Vercel Dashboard (najłatwiejsze)**

1. Wejdź do Vercel Dashboard → Twój projekt → Storage
2. Jeśli używasz Vercel Postgres, kliknij "Backup" w ustawieniach bazy
3. Vercel automatycznie utworzy backup

**Opcja 2: Przez Prisma (BEZ pg_dump - najłatwiejsze dla terminala)** ⭐

```bash
# 1. Ustaw DATABASE_URL na produkcyjną bazę
export DATABASE_URL="postgresql://user:password@host:port/database"

# 2. Uruchom backup przez Prisma
npm run backup-production-prisma

# Backup zostanie zapisany jako JSON w backups/
```

**Opcja 3: Przez terminal z pg_dump (wymaga instalacji)**

Najpierw zainstaluj PostgreSQL tools:
```bash
# macOS
brew install postgresql@15
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

Potem:
```bash
# 1. Ustaw DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# 2. Uruchom backup
./scripts/backup-production-db.sh
```

**Opcja 3: Przez Supabase/Neon Dashboard**

- **Supabase**: Dashboard → Database → Backups
- **Neon**: Dashboard → Branches → Create backup

## 🔙 Przywracanie Backupu

### SQLite

```bash
# Metoda 1: Ręcznie
cp backups/backup-2025-12-30T14-30-00.db prisma/dev.db

# Metoda 2: Skrypt
npm run restore-db backups/backup-2025-12-30T14-30-00.db
```

### PostgreSQL

```bash
# Użyj skryptu (wymaga pg_restore)
npm run restore-db backups/backup-2025-12-30T14-30-00.sql

# Lub ręcznie:
pg_restore -h <host> -p <port> -U <user> -d <database> backups/backup-2025-12-30T14-30-00.sql
```

## ✅ Bezpieczne Dodanie Push Subscriptions

1. **Zrób backup** (opcjonalnie, ale zalecane):
   ```bash
   npm run backup-db
   ```

2. **Dodaj nową tabelę** (NIE usuwa danych):
   ```bash
   npx prisma db push
   ```

3. **Sprawdź, że wszystko działa**:
   ```bash
   npm run dev
   ```

4. **Jeśli coś pójdzie nie tak** (mało prawdopodobne):
   ```bash
   npm run restore-db backups/backup-YYYY-MM-DDTHH-MM-SS.db
   ```

## 📋 Co robi `prisma db push`?

- ✅ Dodaje nową tabelę `push_subscriptions`
- ✅ Dodaje relację do tabeli `users`
- ❌ **NIE usuwa** istniejących tabel
- ❌ **NIE usuwa** istniejących danych
- ❌ **NIE modyfikuje** istniejących kolumn

## 🔍 Sprawdzenie przed i po

Możesz sprawdzić zawartość bazy przed i po:

### SQLite
```bash
sqlite3 prisma/dev.db ".tables"  # Lista tabel
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM workouts;"  # Liczba treningów
```

### PostgreSQL
```bash
psql $DATABASE_URL -c "\dt"  # Lista tabel
psql $DATABASE_URL -c "SELECT COUNT(*) FROM workouts;"  # Liczba treningów
```

## 💡 Tip

Backupy są zapisywane w folderze `backups/`. Możesz je okresowo czyścić:

```bash
# Usuń backupy starsze niż 30 dni
find backups/ -name "backup-*" -mtime +30 -delete
```

