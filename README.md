# Treniren - Training Diary

A personal training diary application for tracking workouts, climbing sessions, and performance patterns.

## Features

- **Workout Tracking**: Record different types of workouts (Gym, Bouldering, Circuits, Lead Rock, Lead Wall, Mental Practice)
- **Mental State Tracking**: Track focus levels, mental states, and climb sections for lead climbing
- **Cycle Integration**: Menstrual cycle tracking with personalized training recommendations
- **Tagging System**: Organize workouts with custom tags
- **Calendar View**: Visual calendar with workout history and cycle phases
- **PWA Support**: Installable app with offline capabilities
- **Multi-language**: English and Polish support

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM with SQLite (development) / PostgreSQL (production)
- **PWA**: Service Worker, Web App Manifest

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd treniren_app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your database URL
```

4. Set up the database
```bash
npx prisma db push
npx prisma generate
```

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:2137](http://localhost:2137) to view the application.

## Database Setup

### Development (SQLite)
```bash
# Database will be created automatically at ./prisma/dev.db
npx prisma db push
```

### Production (PostgreSQL)
```bash
# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/treniren"
npx prisma db push
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
3. Deploy

### Other Platforms

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Environment Variables

- `DATABASE_URL`: Database connection string
- `SUPABASE_URL`: Supabase project URL (optional)
- `SUPABASE_ANON_KEY`: Supabase anonymous key (optional)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret (optional)
- `NEXTAUTH_SECRET`: NextAuth secret (optional)
- `NEXTAUTH_URL`: NextAuth URL (optional)

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   ├── calendar/       # Calendar page
│   └── workouts/       # Workouts page
├── components/         # React components
├── contexts/          # React contexts
├── hooks/             # Custom hooks
├── lib/               # Utility libraries
└── types/             # TypeScript type definitions

prisma/
├── schema.prisma      # Database schema
└── dev.db            # SQLite database (development)

messages/
├── en.json           # English translations
└── pl.json           # Polish translations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.