# Market Pulse Bot

Real-time financial alert system delivered through a Telegram bot using GrammyJS and TypeScript.

## Features

- Real-time market price aggregation (USD, Gold, Cryptocurrency)
- Intelligent price alerts (Threshold, Movement, Zone, Trend)
- Multi-language support (English and Arabic)
- Merchant reputation system
- User subscription plans (Free, Pro, Merchant Pro)
- Admin dashboard for system management

## Tech Stack

- **Bot Framework**: GrammyJS with plugins (conversations, menu, i18n)
- **Language**: TypeScript
- **Database**: Neon Postgres (serverless)
- **ORM**: Prisma
- **Authentication**: Better Auth
- **Web Server**: ExpressJS
- **Deployment**: Render
- **Package Manager**: Yarn

## Prerequisites

- Node.js 18+
- Yarn 1.22.0+
- Neon Postgres database
- Telegram Bot Token

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```

4. Set up the database:
   ```bash
   yarn prisma:generate
   yarn prisma:migrate
   ```

5. Run in development mode:
   ```bash
   yarn dev
   ```

## Environment Variables

See `.env.example` for all required environment variables.

## Scripts

### Development
- `yarn dev` - Run in development mode with hot reload
- `yarn build` - Build for production
- `yarn start` - Start production server

### Code Quality
- `yarn typecheck` - Run TypeScript type checking
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Run ESLint and auto-fix issues
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check code formatting
- `yarn validate` - Run typecheck, lint, and format check

### Testing
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode

### Database
- `yarn prisma:generate` - Generate Prisma client
- `yarn prisma:migrate` - Run database migrations
- `yarn prisma:studio` - Open Prisma Studio

### Background Jobs
- `yarn job:fetch-prices` - Run price fetcher job
- `yarn job:calculate-prices` - Run price calculator job
- `yarn job:monitor-alerts` - Run alert monitor job
- `yarn job:generate-reports` - Run report generator job

## Project Structure

```
├── src/
│   ├── handlers/      # Bot command and callback handlers
│   ├── middleware/    # Bot middleware (auth, i18n, rate limiting)
│   ├── services/      # Business logic services
│   ├── jobs/          # Background jobs
│   ├── lib/           # Shared libraries (prisma, auth)
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── prisma/            # Database schema and migrations
├── tests/             # Test files
├── locales/           # i18n translation files
└── dist/              # Build output
```

## License

MIT
