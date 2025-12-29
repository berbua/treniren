# Treniren App - Architecture Analysis

## Overview
**Treniren** (also branded as "Unicorn Climb") is a comprehensive training diary application built with Next.js 15, designed for tracking workouts, climbing sessions, and performance patterns with special focus on menstrual cycle integration.

## Tech Stack

### Core Framework
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Turbopack** - Fast bundler (enabled in dev mode)

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **PostCSS** - CSS processing

### Database & ORM
- **Prisma 6.16.2** - ORM for database management
- **SQLite** - Development database (`prisma/dev.db`)
- **PostgreSQL** - Production database (configurable)

### Authentication
- **NextAuth.js 4.24.11** - Authentication framework
- **@auth/prisma-adapter** - Prisma adapter for NextAuth
- **bcryptjs** - Password hashing
- **Providers**: Google OAuth, Credentials (email/password)

### Additional Libraries
- **@supabase/supabase-js** - Supabase integration (optional)
- **nodemailer** - Email sending for password reset

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/         # Authentication endpoints
│   │   │   ├── [...nextauth]/  # NextAuth handler
│   │   │   ├── register/       # User registration
│   │   │   ├── forgot-password/# Password reset request
│   │   │   └── reset-password/ # Password reset
│   │   ├── events/        # Event CRUD operations
│   │   ├── exercises/     # Exercise management
│   │   ├── statistics/    # Statistics calculations
│   │   ├── tags/          # Tag management
│   │   ├── user/          # User data
│   │   ├── user-profile/  # User profile management
│   │   └── workouts/      # Workout CRUD operations
│   ├── auth/              # Authentication pages
│   │   ├── signin/        # Sign in page
│   │   ├── signup/        # Sign up page
│   │   ├── forgot-password/# Password reset request page
│   │   ├── reset-password/ # Password reset page
│   │   └── logout/        # Logout handler
│   ├── calendar/          # Calendar view
│   ├── dashboard/         # Main dashboard
│   ├── events/            # Events management page
│   ├── profile/           # User profile page
│   ├── statistics/        # Statistics dashboard
│   ├── strong-mind/       # Mental practice section
│   └── workouts/          # Workouts management page
├── components/            # React components
│   ├── AuthGuard.tsx     # Route protection component
│   ├── CycleConsentModal.tsx
│   ├── CycleInfo.tsx
│   ├── CycleSetupFlow.tsx
│   ├── CycleSetupForm.tsx
│   ├── EnhancedWorkoutForm.tsx
│   ├── ErrorBoundary.tsx
│   ├── EventCard.tsx
│   ├── EventForm.tsx
│   ├── GoalProgressDisplay.tsx
│   ├── LanguageSwitcher.tsx
│   ├── LoadingSpinner.tsx
│   ├── MessagesPanel.tsx
│   ├── NavigationHeader.tsx
│   ├── NotificationBell.tsx
│   ├── OfflineIndicator.tsx
│   ├── OfflineWorkoutForm.tsx
│   ├── ProcessGoalsSection.tsx
│   ├── Providers.tsx      # Main app providers wrapper
│   ├── PWAInstallPrompt.tsx
│   ├── ServiceWorkerProvider.tsx
│   ├── StatisticsButton.tsx
│   ├── StatisticsContent.tsx
│   ├── StatisticsDashboard.tsx
│   ├── StrongMindSection.tsx
│   ├── TagSelector.tsx
│   ├── TrainingTypeFilter.tsx
│   ├── UserMenu.tsx
│   ├── UserProfile.tsx
│   └── WorkoutCard.tsx
├── contexts/              # React Context providers
│   ├── CycleContext.tsx   # Menstrual cycle state
│   ├── LanguageContext.tsx # i18n state
│   └── NotificationContext.tsx # Notification state
├── hooks/                 # Custom React hooks
│   └── useOffline.ts      # Offline detection
├── lib/                   # Utility libraries
│   ├── activity-notifications.ts
│   ├── auth-helpers.ts
│   ├── auth-utils.ts
│   ├── auth.ts            # NextAuth configuration
│   ├── cycle-notifications.ts
│   ├── cycle-utils.ts
│   ├── notification-service.ts
│   ├── offline-storage.ts
│   ├── prisma.ts          # Prisma client singleton
│   ├── service-worker.ts
│   ├── statistics-service.ts
└── types/                 # TypeScript definitions
    ├── event.ts
    ├── next-auth.d.ts     # NextAuth type extensions
    ├── profile.ts
    └── workout.ts
```

## Database Schema

### Core Models

#### User & Authentication
- **User** - Core user model with email, name, nickname, password
- **Account** - OAuth provider accounts (Google, etc.)
- **Session** - NextAuth sessions
- **PasswordResetToken** - Password reset tokens

#### User Profile
- **UserProfile** - Extended user data including:
  - Cycle tracking settings (avg length, last period date)
  - Timezone
  - Google Sheets integration URL
  - Photo URL

#### Training Data
- **Plan** - Training plans with date, title, notes
- **Workout** - Individual workout sessions with:
  - Types: GYM, BOULDERING, CIRCUITS, LEAD_ROCK, LEAD_ARTIFICIAL, MENTAL_PRACTICE
  - Training volume (TR1-TR5)
  - Mental state tracking
  - Pre/post session feelings
  - Gratitude and improvements notes
- **Exercise** - Custom exercise definitions
- **WorkoutExercise** - Exercises within workouts
- **Set** - Individual sets with reps, weight, RIR, success

#### Events
- **Event** - Life events including:
  - Types: INJURY, PHYSIO, COMPETITION, TRIP, OTHER
  - Trip-specific fields (dates, destination, climbing type)
  - Injury severity and status

#### Organization
- **Tag** - User-defined tags with colors
- **PlanTag**, **WorkoutTag**, **EventTag** - Many-to-many relationships

### Enums
- **WorkoutType**: GYM, BOULDERING, CIRCUITS, LEAD_ROCK, LEAD_ARTIFICIAL, MENTAL_PRACTICE
- **TrainingVolume**: TR1-TR5
- **MentalPracticeType**: MEDITATION, REFLECTING, OTHER
- **TimeOfDay**: MORNING, MIDDAY, EVENING
- **EventType**: INJURY, PHYSIO, COMPETITION, TRIP, OTHER
- **FocusState**: CHOKE, DISTRACTION, PRESENT, FOCUSED, CLUTCH, FLOW
- **ComfortZone**: COMFORT, STRETCH1, STRETCH2, PANIC
- **BoulderType**: SLAB, VERTICAL, OVERHANG, ROOF, COMPSTYLE
- And more...

## Authentication Flow

### Providers
1. **Google OAuth** - Social login via Google
2. **Credentials** - Email/password authentication

### Session Management
- Uses JWT strategy (not database sessions)
- 30-day session max age
- Custom JWT callback to sync OAuth users with database
- Session includes user ID in token

### Middleware Protection
- Protected routes: `/dashboard`, `/workouts`, `/calendar`, `/statistics`
- Public routes: `/`, `/auth/signin`, `/auth/signup`, `/auth/error`
- API routes require authentication (except auth endpoints)

## Key Features

### 1. Workout Tracking
- Multiple workout types with type-specific fields
- Exercise tracking with sets, reps, weight, RIR
- Mental state tracking for lead climbing
- Pre/post session feelings
- Gratitude and improvement notes

### 2. Cycle Integration
- Menstrual cycle tracking
- Cycle-aware training recommendations
- Cycle phase visualization in calendar
- Cycle notifications

### 3. Event Management
- Track injuries, physio sessions, competitions, trips
- Trip countdown feature
- Event tagging system

### 4. Statistics & Analytics
- Workout statistics
- Performance tracking
- Goal progress display

### 5. PWA Support
- Service Worker for offline functionality
- Web App Manifest
- Install prompt
- Offline workout form

### 6. Internationalization
- English and Polish support
- Language context provider
- Translation files in `messages/` directory

### 7. Offline Support
- Offline storage utilities
- Offline workout creation
- Service worker for caching

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler

### Data Management
- `GET/POST /api/workouts` - Workout CRUD
- `GET/PUT/DELETE /api/workouts/[id]` - Individual workout operations
- `GET/POST /api/events` - Event CRUD
- `GET/PUT/DELETE /api/events/[id]` - Individual event operations
- `GET/POST /api/exercises` - Exercise management
- `GET/POST /api/tags` - Tag management
- `GET /api/statistics` - Statistics calculations
- `GET/PUT /api/user` - User data
- `GET/PUT /api/user-profile` - User profile

## Environment Variables

Required:
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Secret for JWT signing
- `NEXTAUTH_URL` - Base URL for the app

Optional:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `EMAIL_SERVER_*` - Email configuration for password reset
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` - Supabase integration

## Development Workflow

### Setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Set up database: `npx prisma db push`
4. Generate Prisma client: `npx prisma generate`
5. Start dev server: `npm run dev`

### Database Migrations
- Development: `npx prisma db push` (SQLite)
- Production: Use Prisma migrations with PostgreSQL

### Build & Deploy
- Build: `npm run build`
- Start production: `npm start`
- Recommended: Deploy to Vercel

## Architecture Patterns

### State Management
- React Context API for global state (cycle, language, notifications)
- Server components for data fetching (Next.js App Router)
- Client components for interactivity

### Data Fetching
- Server-side rendering with App Router
- API routes for mutations
- Direct Prisma queries in server components

### Error Handling
- ErrorBoundary component for React error catching
- API error responses with proper status codes
- Middleware for authentication errors

### Offline Support
- Service Worker for caching
- Local storage utilities
- Offline-first forms

## Security Considerations

1. **Authentication**: NextAuth.js with secure session management
2. **Password Hashing**: bcryptjs for password storage
3. **Route Protection**: Middleware-based route guards
4. **API Security**: Token-based API authentication
5. **Input Validation**: Should be implemented in API routes

## Performance Optimizations

1. **Turbopack**: Fast bundling in development
2. **Server Components**: Reduced client-side JavaScript
3. **PWA Caching**: Service worker for offline assets
4. **Database Indexing**: Prisma handles indexes

## Future Considerations

- Prisma version update (6.16.2 → 7.2.0 available)
- Google Calendar API integration (commented in env.example)
- Enhanced statistics and analytics
- More workout types and tracking features
- Social features (sharing, community)


