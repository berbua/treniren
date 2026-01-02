# 💾 Backup Produkcyjnej Bazy Danych

## 🚨 Problem: `pg_dump: command not found`

Jeśli widzisz ten błąd, musisz zainstalować narzędzia PostgreSQL.

## 📦 Instalacja PostgreSQL Tools (macOS)

### Metoda 1: Homebrew (Rekomendowane)

```bash
# Zainstaluj PostgreSQL (zawiera pg_dump)
brew install postgresql@15

# Dodaj do PATH (dla zsh)
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Sprawdź czy działa
pg_dump --version
```

### Metoda 2: Tylko narzędzia (lżejsze)

```bash
# Zainstaluj tylko narzędzia klienckie
brew install libpq

# Dodaj do PATH
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Sprawdź
pg_dump --version
```

## ✅ Alternatywne Metody (BEZ instalacji pg_dump)

### Opcja 1: Przez Vercel Dashboard (NAJŁATWIEJSZE) ⭐

1. Wejdź do [Vercel Dashboard](https://vercel.com)
2. Wybierz swój projekt
3. Przejdź do **Storage** → **Postgres**
4. Kliknij **Settings** → **Backups**
5. Kliknij **Create Backup**
6. Vercel automatycznie utworzy backup

**To jest najłatwiejsza metoda i nie wymaga instalacji niczego!**

### Opcja 2: Przez Prisma Studio (Wizualny backup)

```bash
# 1. Ustaw DATABASE_URL na produkcyjną bazę
export DATABASE_URL="postgresql://user:password@host:port/database"

# 2. Otwórz Prisma Studio
npx prisma studio

# 3. Możesz eksportować dane ręcznie przez interfejs
```

### Opcja 3: Przez Node.js Script (Bez pg_dump)

Użyj skryptu, który używa Prisma do eksportu danych:

```bash
# Uruchom skrypt backupu przez Prisma
node scripts/backup-via-prisma.js
```

### Opcja 4: Przez Supabase/Neon Dashboard

- **Supabase**: Dashboard → Database → Backups → Create Backup
- **Neon**: Dashboard → Branches → Create Branch (jako backup)

## 🔧 Backup przez Prisma (Node.js Script)

Stworzę skrypt, który używa Prisma do backupu bez potrzeby `pg_dump`:

```bash
# Ustaw DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Uruchom backup
npm run backup-production-prisma
```

## 📋 Która metoda wybrać?

| Metoda | Trudność | Wymaga instalacji | Zalecane dla |
|--------|----------|-------------------|--------------|
| **Vercel Dashboard** | ⭐ Najłatwiejsza | ❌ Nie | Vercel Postgres |
| **Supabase Dashboard** | ⭐ Najłatwiejsza | ❌ Nie | Supabase |
| **Neon Dashboard** | ⭐ Najłatwiejsza | ❌ Nie | Neon |
| **Prisma Script** | ⭐⭐ Średnia | ❌ Nie | Wszystkie |
| **pg_dump** | ⭐⭐⭐ Trudna | ✅ Tak | Wszystkie |

## 💡 Rekomendacja

**Jeśli używasz Vercel Postgres**: Użyj Vercel Dashboard - to najłatwiejsze!

**Jeśli używasz Supabase/Neon**: Użyj ich dashboardów.

**Jeśli chcesz backup przez terminal**: Zainstaluj PostgreSQL tools lub użyj skryptu Prisma.



