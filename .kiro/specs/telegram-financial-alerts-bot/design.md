# Design Document: Market Pulse - Telegram Financial Alerts Bot

## Overview

Market Pulse is a real-time financial alert system delivered through a Telegram bot built with GrammyJS (TypeScript), Neon Postgres, Prisma ORM, and deployed on Render. The system aggregates market prices (USD, gold, cryptocurrency) from multiple sources, applies statistical filtering and reputation scoring, and sends intelligent alerts to users. The bot features a modern UI/UX with inline keyboards, conversational flows, and supports English/Arabic localization.

### Key Technologies

- **Bot Framework**: GrammyJS with plugins (conversations, menu, i18n, inline keyboard)
- **Language**: TypeScript
- **Database**: Neon Postgres (serverless)
- **ORM**: Prisma
- **Authentication**: Better Auth
- **Web Server**: ExpressJS
- **Deployment**: Render (webhook mode)
- **Package Manager**: Yarn
- **Localization**: English and Arabic (Grammy i18n plugin)

### Target Markets

Syria, Lebanon, Egypt, and other markets with high volatility and unofficial pricing where trustworthy real-time price information is critical.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "External Sources"
        TG[Telegram API]
        API1[Crypto APIs]
        API2[Gold APIs]
        API3[Forex APIs]
    end
    
    subgraph "Render Deployment"
        subgraph "ExpressJS Server"
            WH[Webhook Handler]
            HEALTH[Health Check]
            ADMIN[Admin Dashboard]
        end
        
        subgraph "Grammy Bot"
            MW[Middleware Layer]
            CMD[Command Handlers]
            CONV[Conversation Handlers]
            MENU[Menu Handlers]
            CB[Callback Handlers]
        end
        
        subgraph "Business Logic"
            AUTH[Auth Service]
            PRICE[Price Service]
            ALERT[Alert Service]
            REP[Reputation Service]
            TREND[Trend Detection]
            NOTIF[Notification Service]
        end
        
        subgraph "Background Jobs"
            FETCH[Price Fetcher]
            CALC[Price Calculator]
            MONITOR[Alert Monitor]
            REPORT[Report Generator]
        end
    end
    
    subgraph "Data Layer"
        PRISMA[Prisma Client]
        DB[(Neon Postgres)]
    end
    
    TG <-->|Webhook| WH
    WH --> MW
    MW --> CMD
    MW --> CONV
    MW --> MENU
    MW --> CB
    
    CMD --> AUTH
    CMD --> PRICE
    CMD --> ALERT
    
    CONV --> ALERT
    MENU --> PRICE
    CB --> ALERT
    
    FETCH --> API1
    FETCH --> API2
    FETCH --> API3
    FETCH --> PRISMA
    
    CALC --> PRISMA
    MONITOR --> PRISMA
    MONITOR --> NOTIF
    REPORT --> PRISMA
    REPORT --> NOTIF
    
    NOTIF --> TG
    
    AUTH --> PRISMA
    PRICE --> PRISMA
    ALERT --> PRISMA
    REP --> PRISMA
    TREND --> PRISMA
    
    PRISMA --> DB
    
    ADMIN --> PRISMA
```

### Deployment Architecture

```mermaid
graph LR
    subgraph "Render"
        WEB[Web Service]
        CRON[Cron Jobs]
    end
    
    subgraph "Neon"
        PG[(Postgres)]
    end
    
    subgraph "External"
        TG[Telegram]
        APIS[Price APIs]
    end
    
    WEB <-->|Webhook| TG
    WEB -->|Fetch| APIS
    CRON -->|Trigger| WEB
    WEB <-->|SQL| PG
```

## Components and Interfaces

### 1. Bot Layer

#### 1.1 Grammy Bot Instance

**Responsibilities:**
- Initialize Grammy bot with TypeScript context
- Register middleware (auth, i18n, rate limiting, error handling)
- Register plugins (conversations, menu, inline keyboard)
- Handle webhook updates from Telegram

**Key Interfaces:**

```typescript
interface BotContext extends Context {
  i18n: I18nFlavor;
  session: SessionFlavor<SessionData>;
  conversation: ConversationFlavor;
  user?: User;
  userRole?: UserRole;
}

interface SessionData {
  userId: string;
  language: 'en' | 'ar';
  currentMenu?: string;
}

enum UserRole {
  USER = 'USER',
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN'
}
```

#### 1.2 Middleware Layer

**Authentication Middleware:**
- Validates user session using Better Auth
- Loads user data from database
- Attaches user and role to context
- Rejects requests from deactivated users

**Localization Middleware:**
- Loads user language preference
- Initializes i18n context
- Defaults to English for new users

**Rate Limiting Middleware:**
- Tracks requests per user per minute
- Enforces 30 requests/minute limit
- Returns error message on limit exceeded

**Error Handling Middleware:**
- Catches unhandled errors
- Logs errors with context
- Sends user-friendly error messages
- Includes help button in error messages

#### 1.3 Command Handlers

**Registered Commands:**
- `/start` - Welcome message with language selection
- `/help` - Contextual help menu
- `/price [asset]` - View current price
- `/alerts` - Manage alerts dashboard
- `/settings` - User settings menu
- `/submit` - Submit price (merchants only)
- `/admin` - Admin commands (admins only)

**Implementation Pattern:**

```typescript
bot.command('price', authMiddleware, async (ctx) => {
  const asset = ctx.match || 'usd';
  const priceData = await priceService.getAggregatedPrice(asset);
  
  const keyboard = new InlineKeyboard()
    .text(ctx.t('set_alert'), `alert:${asset}`)
    .text(ctx.t('refresh'), `refresh:${asset}`)
    .row()
    .text(ctx.t('view_history'), `history:${asset}`);
  
  await ctx.reply(
    formatPriceMessage(priceData, ctx.i18n),
    { reply_markup: keyboard, parse_mode: 'HTML' }
  );
});
```

#### 1.4 Conversation Handlers

**Alert Creation Conversation:**

```typescript
async function createAlertConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  // Step 1: Select asset
  await ctx.reply(ctx.t('select_asset'), {
    reply_markup: assetKeyboard
  });
  const assetCtx = await conversation.wait();
  const asset = assetCtx.callbackQuery?.data;
  
  // Step 2: Select alert type
  await ctx.reply(ctx.t('select_alert_type'), {
    reply_markup: alertTypeKeyboard
  });
  const typeCtx = await conversation.wait();
  const alertType = typeCtx.callbackQuery?.data;
  
  // Step 3-N: Collect parameters based on type
  // ... (threshold value, percentage, time window, etc.)
  
  // Final: Confirm and save
  await ctx.reply(ctx.t('confirm_alert', { summary }), {
    reply_markup: confirmKeyboard
  });
  const confirmCtx = await conversation.wait();
  
  if (confirmCtx.callbackQuery?.data === 'confirm') {
    await alertService.createAlert(userId, alertData);
    await ctx.reply(ctx.t('alert_created'));
  }
}
```

#### 1.5 Menu System

**Main Menu:**

```typescript
const mainMenu = new Menu<BotContext>('main')
  .text(ctx => `📊 ${ctx.t('view_prices')}`, async (ctx) => {
    await ctx.conversation.enter('viewPrices');
  })
  .text(ctx => `🔔 ${ctx.t('manage_alerts')}`, async (ctx) => {
    await ctx.conversation.enter('manageAlerts');
  })
  .row()
  .text(ctx => `⚙️ ${ctx.t('settings')}`, async (ctx) => {
    await ctx.conversation.enter('settings');
  })
  .text(ctx => `❓ ${ctx.t('help')}`, async (ctx) => {
    await showHelp(ctx);
  });
```

### 2. Service Layer

#### 2.1 Authentication Service

**Responsibilities:**
- Create user accounts with Better Auth
- Manage sessions (30-day expiration)
- Verify user roles
- Handle role assignments
- Integrate with Telegram authentication

**Better Auth Configuration:**

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "./lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false // Telegram handles verification
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 // Update session every 24 hours
  },
  plugins: [
    admin({
      defaultRole: "user",
      impersonationSessionDuration: 60 * 60 // 1 hour
    })
  ],
  trustedOrigins: [process.env.TELEGRAM_WEBHOOK_URL || ""],
  advanced: {
    generateId: () => {
      // Use cuid for consistency with Prisma
      return createId();
    }
  }
});
```

**Key Methods:**

```typescript
interface AuthService {
  // Create user from Telegram data
  createUserFromTelegram(telegramId: string, telegramData: TelegramUser): Promise<User>;
  
  // Create session for Telegram user
  createSession(userId: string, metadata: SessionMetadata): Promise<Session>;
  
  // Validate session token
  validateSession(sessionToken: string): Promise<{ user: User; session: Session } | null>;
  
  // Get user by Telegram ID
  getUserByTelegramId(telegramId: string): Promise<User | null>;
  
  // Role management (using Better Auth admin plugin)
  getUserRole(userId: string): Promise<UserRole>;
  updateUserRole(userId: string, role: UserRole): Promise<void>;
  
  // Ban management (using Better Auth admin plugin)
  banUser(userId: string, reason: string, expiresAt?: Date): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  
  // Account management
  deactivateUser(userId: string): Promise<void>;
  activateUser(userId: string): Promise<void>;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}
```

#### 2.2 Price Service

**Responsibilities:**
- Fetch prices from external APIs
- Store price submissions
- Calculate aggregated market prices
- Validate price submissions
- Track price history

**Key Methods:**

```typescript
interface PriceService {
  submitPrice(merchantId: string, asset: string, value: number): Promise<PriceSubmission>;
  fetchExternalPrices(): Promise<void>;
  calculateAggregatedPrice(asset: string): Promise<AggregatedPrice>;
  getAggregatedPrice(asset: string): Promise<AggregatedPrice>;
  getPriceHistory(asset: string, hours: number): Promise<PriceHistory>;
  validateSubmission(submission: PriceSubmission): Promise<ValidationResult>;
}

interface AggregatedPrice {
  asset: string;
  price: number;
  trend: 'up' | 'down' | 'stable';
  high24h: number;
  low24h: number;
  spread: number;
  merchantCount: number;
  trustedMerchantCount: number;
  confidence: 'high' | 'medium' | 'low';
  lastUpdate: Date;
}

interface ValidationResult {
  isValid: boolean;
  isSuspicious: boolean;
  deviationPercent: number;
  reason?: string;
}
```

#### 2.3 Alert Service

**Responsibilities:**
- Create, update, delete alerts
- Monitor price changes against alerts
- Trigger notifications
- Manage alert limits by plan

**Key Methods:**

```typescript
interface AlertService {
  createAlert(userId: string, alertData: AlertData): Promise<Alert>;
  updateAlert(alertId: string, updates: Partial<AlertData>): Promise<Alert>;
  deleteAlert(alertId: string): Promise<void>;
  toggleAlert(alertId: string): Promise<Alert>;
  getUserAlerts(userId: string): Promise<Alert[]>;
  checkAlerts(asset: string, newPrice: number): Promise<TriggeredAlert[]>;
  enforceAlertLimits(userId: string, plan: UserPlan): Promise<boolean>;
}

interface AlertData {
  asset: string;
  type: 'threshold' | 'movement' | 'zone' | 'trend';
  parameters: ThresholdParams | MovementParams | ZoneParams | TrendParams;
}

interface ThresholdParams {
  value: number;
  direction: 'above' | 'below';
}

interface MovementParams {
  percentage: number;
  timeWindowMinutes: number;
}

interface ZoneParams {
  min: number;
  max: number;
}

interface TrendParams {
  patterns: ('uptrend' | 'downtrend' | 'volatility' | 'reversal')[];
}
```

#### 2.4 Reputation Service

**Responsibilities:**
- Calculate merchant reputation scores
- Grant/revoke trusted status
- Track submission accuracy
- Handle merchant flagging

**Key Methods:**

```typescript
interface ReputationService {
  calculateReputation(merchantId: string): Promise<number>;
  updateReputationAfterSubmission(
    merchantId: string,
    wasAccurate: boolean
  ): Promise<void>;
  checkTrustedStatus(merchantId: string): Promise<boolean>;
  flagMerchant(merchantId: string, adminId: string): Promise<void>;
  unflagMerchant(merchantId: string, adminId: string): Promise<void>;
  getMerchantStats(merchantId: string): Promise<MerchantStats>;
}

interface MerchantStats {
  totalSubmissions: number;
  accurateSubmissions: number;
  reputationScore: number;
  isTrusted: boolean;
  isFlagged: boolean;
  averageDeviation: number;
}
```

#### 2.5 Trend Detection Service

**Responsibilities:**
- Detect uptrends and downtrends
- Identify high volatility periods
- Detect market reversals
- Calculate trend indicators

**Key Methods:**

```typescript
interface TrendDetectionService {
  detectTrend(asset: string): Promise<TrendAnalysis>;
  detectVolatility(asset: string): Promise<VolatilityAnalysis>;
  detectReversal(asset: string): Promise<ReversalAnalysis | null>;
}

interface TrendAnalysis {
  trend: 'uptrend' | 'downtrend' | 'stable';
  strength: number; // 0-100
  duration: number; // intervals
  totalChange: number; // percentage
}

interface VolatilityAnalysis {
  isHighVolatility: boolean;
  standardDeviation: number;
  volatilityPercent: number;
}

interface ReversalAnalysis {
  previousTrend: 'uptrend' | 'downtrend';
  newTrend: 'uptrend' | 'downtrend';
  reversalPoint: Date;
}
```

#### 2.6 Notification Service

**Responsibilities:**
- Send alert notifications
- Send daily reports
- Format messages with localization
- Handle notification delays for free users

**Key Methods:**

```typescript
interface NotificationService {
  sendAlertNotification(
    userId: string,
    alert: Alert,
    triggerData: TriggerData
  ): Promise<void>;
  sendDailyReport(userId: string, reportData: DailyReport): Promise<void>;
  sendBulkNotifications(notifications: Notification[]): Promise<void>;
}

interface TriggerData {
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

interface DailyReport {
  asset: string;
  date: Date;
  open: number;
  close: number;
  high: number;
  low: number;
  trend: string;
  volatility: number;
}
```

### 3. Background Jobs

#### 3.1 Price Fetcher Job

**Schedule**: Every 60 seconds for crypto/forex, every 300 seconds for gold

**Responsibilities:**
- Fetch prices from external APIs
- Store fetched prices with source identifier
- Handle API failures gracefully
- Log fetch operations

#### 3.2 Price Calculator Job

**Schedule**: Every 30 seconds

**Responsibilities:**
- Calculate aggregated market prices for all assets
- Apply statistical filtering
- Weight trusted merchants higher
- Update aggregated price records
- Mark low-confidence prices

#### 3.3 Alert Monitor Job

**Schedule**: Every 30 seconds

**Responsibilities:**
- Check all active alerts against new prices
- Identify triggered alerts
- Queue notifications
- Apply delays for free users
- Log triggered alerts

#### 3.4 Report Generator Job

**Schedule**: Daily at 20:00 local time

**Responsibilities:**
- Generate daily reports for subscribed users
- Calculate daily statistics
- Format reports with localization
- Send reports via notification service

### 4. Admin Dashboard

#### 4.1 Dashboard Routes

**Authentication**: All routes protected by Better Auth middleware requiring ADMIN role

**Routes:**
- `GET /admin` - Dashboard home with statistics
- `GET /admin/users` - User management page
- `GET /admin/merchants` - Merchant management page
- `GET /admin/submissions` - Price submission audit
- `GET /admin/logs` - System logs viewer
- `POST /admin/users/:id/plan` - Update user plan
- `POST /admin/users/:id/deactivate` - Deactivate user
- `POST /admin/merchants/:id/flag` - Flag merchant
- `POST /admin/merchants/:id/unflag` - Unflag merchant
- `POST /admin/submissions/:id/invalidate` - Invalidate submission
- `POST /admin/operations/recalculate` - Trigger price recalculation
- `POST /admin/operations/clear-cache` - Clear cache

#### 4.2 Dashboard Components

**Statistics Dashboard:**
- User metrics (total, active, new)
- Merchant metrics (total, trusted, flagged)
- Submission metrics (24h count, hourly average)
- Alert metrics (total active, 24h triggered)
- Current prices for all assets

**User Management:**
- Paginated user list with search
- User detail view with activity history
- Plan management
- Account deactivation

**Merchant Management:**
- Paginated merchant list with stats
- Merchant detail view with analytics
- Manual trusted status control
- Flag/unflag operations

**Submission Audit:**
- Paginated submission history
- Filtering by asset, status, date
- Submission detail view
- Manual invalidation

**System Logs:**
- Paginated log viewer
- Filtering by level, date, keyword
- 30-day retention

## Data Models

### Database Schema (Prisma)

```prisma
// Better Auth - User model
model User {
  id              String    @id @default(cuid())
  name            String
  email           String    @unique
  emailVerified   Boolean   @default(false)
  image           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Better Auth - Additional fields for admin plugin
  role            UserRole  @default(USER)
  banned          Boolean   @default(false)
  banReason       String?
  banExpires      DateTime?
  
  // Application-specific fields
  telegramId      String    @unique
  username        String?
  language        String    @default("en")
  plan            UserPlan  @default(FREE)
  isActive        Boolean   @default(true)
  lastActiveAt    DateTime  @default(now())
  
  // Relations
  sessions        Session[]
  accounts        Account[]
  alerts          Alert[]
  submissions     PriceSubmission[]
  votes           PriceVote[]
  merchantProfile Merchant?
  
  @@index([telegramId])
  @@index([email])
  @@index([role])
  @@index([plan])
}

enum UserRole {
  USER
  MERCHANT
  ADMIN
}

enum UserPlan {
  FREE
  PRO
  MERCHANT_PRO
}

// Better Auth - Session model
model Session {
  id            String   @id @default(cuid())
  expiresAt     DateTime
  token         String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  ipAddress     String?
  userAgent     String?
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Better Auth - Admin plugin field
  impersonatedBy String?
  
  @@index([userId])
  @@index([token])
}

// Better Auth - Account model (for OAuth providers)
model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?   @db.Text
  refreshToken          String?   @db.Text
  idToken               String?   @db.Text
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?   @db.Text
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([userId])
  @@unique([providerId, accountId])
}

// Better Auth - Verification model (for email verification, password reset, etc.)
model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([identifier])
}

// Merchant profile
model Merchant {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])
  name                String
  reputationScore     Float    @default(0)
  totalSubmissions    Int      @default(0)
  accurateSubmissions Int      @default(0)
  isTrusted           Boolean  @default(false)
  isFlagged           Boolean  @default(false)
  isVerified          Boolean  @default(false)
  createdAt           DateTime @default(now())
  
  submissions         PriceSubmission[]
  
  @@index([isTrusted])
  @@index([isFlagged])
}

// Price submission
model PriceSubmission {
  id              String   @id @default(cuid())
  asset           String
  value           Float
  source          String   // 'merchant', 'api', 'user'
  sourceId        String?  // merchant ID or API name
  merchant        Merchant? @relation(fields: [sourceId], references: [id])
  submittedBy     User?    @relation(fields: [submittedById], references: [id])
  submittedById   String?
  timestamp       DateTime @default(now())
  isValid         Boolean  @default(true)
  isSuspicious    Boolean  @default(false)
  deviationPercent Float?
  upvotes         Int      @default(0)
  downvotes       Int      @default(0)
  
  votes           PriceVote[]
  
  @@index([asset])
  @@index([timestamp])
  @@index([isValid])
  @@index([isSuspicious])
}

// Price vote
model PriceVote {
  id           String          @id @default(cuid())
  submissionId String
  submission   PriceSubmission @relation(fields: [submissionId], references: [id])
  userId       String
  user         User            @relation(fields: [userId], references: [id])
  isUpvote     Boolean
  timestamp    DateTime        @default(now())
  
  @@unique([submissionId, userId])
  @@index([submissionId])
}

// Aggregated price
model AggregatedPrice {
  id                    String   @id @default(cuid())
  asset                 String   @unique
  price                 Float
  trend                 String   // 'up', 'down', 'stable'
  high24h               Float
  low24h                Float
  spread                Float
  merchantCount         Int
  trustedMerchantCount  Int
  confidence            String   // 'high', 'medium', 'low'
  lastUpdate            DateTime @default(now())
  
  @@index([asset])
}

// Alert
model Alert {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  asset       String
  type        AlertType
  parameters  Json
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  lastTriggered DateTime?
  
  @@index([userId])
  @@index([asset])
  @@index([isActive])
}

enum AlertType {
  THRESHOLD
  MOVEMENT
  ZONE
  TREND
}

// Alert trigger log
model AlertTrigger {
  id          String   @id @default(cuid())
  alertId     String
  userId      String
  asset       String
  triggerData Json
  timestamp   DateTime @default(now())
  
  @@index([alertId])
  @@index([userId])
  @@index([timestamp])
}

// System log
model SystemLog {
  id        String   @id @default(cuid())
  level     LogLevel
  message   String
  context   Json?
  timestamp DateTime @default(now())
  
  @@index([level])
  @@index([timestamp])
}

enum LogLevel {
  INFO
  WARNING
  ERROR
}

// Admin action log
model AdminAction {
  id          String   @id @default(cuid())
  adminId     String
  action      String
  targetType  String   // 'user', 'merchant', 'submission'
  targetId    String
  details     Json?
  timestamp   DateTime @default(now())
  
  @@index([adminId])
  @@index([timestamp])
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Core Data Properties

Property 1: Language preference persistence
*For any* user who selects a language, querying the database should return the same language preference
**Validates: Requirements 1.2**

Property 2: Localized message consistency
*For any* user with a stored language preference, all messages sent to that user should be in that language
**Validates: Requirements 1.3**

Property 3: Language change immediacy
*For any* user who changes their language preference, the next message should be in the new language
**Validates: Requirements 1.4**

Property 4: Price submission format validation
*For any* price submission, the system should validate the format before accepting it
**Validates: Requirements 2.1**

Property 5: Price submission round-trip
*For any* valid price submission, querying the database should return the submission with timestamp and merchant identifier intact
**Validates: Requirements 2.2**

Property 6: Suspicious price flagging
*For any* price submission that deviates more than 10% from the recent average, the submission should be flagged as suspicious
**Validates: Requirements 2.3**

Property 7: Suspicious price exclusion
*For any* aggregated market price calculation, no submissions flagged as suspicious should be included
**Validates: Requirements 2.4**

Property 8: Submission confirmation
*For any* merchant price submission, a confirmation message with status should be sent
**Validates: Requirements 2.5**

Property 9: API data persistence
*For any* API data received, querying the database should return the data with source identifier and timestamp
**Validates: Requirements 3.5**

Property 10: API error logging
*For any* failed API request, an error should be logged with full context
**Validates: Requirements 3.4**

### Reputation System Properties

Property 11: Accurate submission reward
*For any* merchant submission that falls within 5% of the final aggregated price, the merchant's accuracy count should increase
**Validates: Requirements 4.1**

Property 12: Inaccurate submission penalty
*For any* merchant submission that deviates more than 10% from the final aggregated price, the merchant's reputation score should decrease
**Validates: Requirements 4.2**

Property 13: Reputation score calculation
*For any* merchant, the reputation score should equal (accurate_submissions / total_submissions) × 100
**Validates: Requirements 4.3**

Property 14: Trusted status grant threshold
*For any* merchant with reputation score exceeding 85, trusted merchant status should be true
**Validates: Requirements 4.4**

Property 15: Trusted status revocation threshold
*For any* merchant with reputation score falling below 70, trusted merchant status should be false
**Validates: Requirements 4.5**

### Price Aggregation Properties

Property 16: Time-based submission filtering
*For any* aggregated market price calculation, all included submissions should have timestamps within the last 600 seconds
**Validates: Requirements 5.1**

Property 17: Suspicious submission exclusion from aggregation
*For any* aggregated market price calculation, no submissions flagged as suspicious should be included
**Validates: Requirements 5.2**

Property 18: Weighted average calculation
*For any* set of valid submissions, the aggregated price should equal the weighted average where trusted merchant submissions have weight 2.0 and regular submissions have weight 1.0
**Validates: Requirements 5.3**

Property 19: Low confidence marking
*For any* aggregated price calculation with fewer than 3 valid submissions, the confidence level should be marked as 'low'
**Validates: Requirements 5.4**

### Alert System Properties

Property 20: Threshold alert parameter validation
*For any* threshold alert creation, the system should validate asset type, threshold value, and direction parameters
**Validates: Requirements 6.1**

Property 21: Threshold alert persistence
*For any* valid threshold alert, querying the database should return the alert with user identifier and active status
**Validates: Requirements 6.2**

Property 22: Threshold alert triggering
*For any* aggregated market price that crosses a threshold in the specified direction, a notification should be sent to the user
**Validates: Requirements 6.3**

Property 23: Threshold notification content
*For any* triggered threshold alert, the notification should include current price, threshold value, and timestamp
**Validates: Requirements 6.4**

Property 24: Free plan alert limit
*For any* user with Free Plan, the system should not allow more than 3 active threshold alerts
**Validates: Requirements 6.5**

Property 25: Movement alert parameter validation
*For any* movement alert creation, the system should validate asset type, percentage threshold, and time window parameters
**Validates: Requirements 7.1**

Property 26: Movement alert persistence
*For any* valid movement alert, querying the database should return the alert with all parameters intact
**Validates: Requirements 7.2**

Property 27: Movement alert triggering
*For any* price change exceeding the specified percentage within the time window, a notification should be sent to the user
**Validates: Requirements 7.3**

Property 28: Movement notification content
*For any* triggered movement alert, the notification should include percentage change, time window, and current price
**Validates: Requirements 7.4**

Property 29: Free plan movement alert restriction
*For any* user with Free Plan, movement alert creation should be rejected
**Validates: Requirements 7.5**

Property 30: Zone alert parameter validation
*For any* zone alert creation, the system should validate that minimum value is less than maximum value
**Validates: Requirements 8.1**

Property 31: Zone alert persistence
*For any* valid zone alert, querying the database should return the alert with all parameters intact
**Validates: Requirements 8.2**

Property 32: Zone alert triggering
*For any* aggregated market price that enters a specified range from outside, a notification should be sent to the user
**Validates: Requirements 8.3**

Property 33: Zone notification content
*For any* triggered zone alert, the notification should include current price, zone boundaries, and entry direction
**Validates: Requirements 8.4**

Property 34: Free plan zone alert restriction
*For any* user with Free Plan, zone alert creation should be rejected
**Validates: Requirements 8.5**

### Trend Detection Properties

Property 35: Uptrend detection
*For any* sequence of 3 consecutive price increases with total increase exceeding 2%, an uptrend should be detected
**Validates: Requirements 9.1**

Property 36: Downtrend detection
*For any* sequence of 3 consecutive price decreases with total decrease exceeding 2%, a downtrend should be detected
**Validates: Requirements 9.2**

Property 37: High volatility detection
*For any* set of 10 prices where standard deviation exceeds 3% of mean price, high volatility should be detected
**Validates: Requirements 9.3**

Property 38: Market reversal detection
*For any* trend direction change after at least 5 consecutive intervals in one direction, a market reversal should be detected
**Validates: Requirements 9.4**

Property 39: Trend notification distribution
*For any* detected trend pattern, all users subscribed to trend alerts for that asset should receive notifications
**Validates: Requirements 9.5**

### Report Generation Properties

Property 40: Daily report content completeness
*For any* generated daily report, it should include highest price, lowest price, opening price, and closing price for each tracked asset
**Validates: Requirements 10.2**

Property 41: Daily report trend inclusion
*For any* generated daily report, it should include the calculated overall trend (uptrend, downtrend, or stable)
**Validates: Requirements 10.3**

Property 42: Daily report volatility inclusion
*For any* generated daily report, it should include the calculated volatility percentage
**Validates: Requirements 10.4**

Property 43: Free plan report restriction
*For any* user with Free Plan, daily reports should not be sent
**Validates: Requirements 10.5**

### Price Display Properties

Property 44: Current price retrieval
*For any* user request for current price, the most recent aggregated market price should be returned
**Validates: Requirements 11.1**

Property 45: Price display content - basic fields
*For any* aggregated market price display, it should include price value, trend indicator, and last update timestamp
**Validates: Requirements 11.2**

Property 46: Price display content - merchant count
*For any* aggregated market price display, it should include the number of trusted merchants contributing to the price
**Validates: Requirements 11.3**

Property 47: Price display content - 24h range
*For any* aggregated market price display, it should include the high and low prices from the last 24 hours
**Validates: Requirements 11.4**

Property 48: Price spread calculation
*For any* aggregated market price display, the spread should equal the difference between highest and lowest current submissions
**Validates: Requirements 11.5**

### Dashboard Properties

Property 49: Dashboard alert listing
*For any* user accessing the dashboard, all their active alerts with alert type, asset, and parameters should be displayed
**Validates: Requirements 12.1**

Property 50: Alert deletion persistence
*For any* deleted alert, it should no longer exist in the database
**Validates: Requirements 12.3**

Property 51: Alert edit validation
*For any* alert edit operation, new parameters should be validated before updating
**Validates: Requirements 12.4**

Property 52: Alert status toggle
*For any* alert status toggle operation, the active flag should flip to the opposite value
**Validates: Requirements 12.5**

### Subscription Properties

Property 53: Plan upgrade persistence
*For any* completed payment verification, the user's plan status should be updated to Pro Plan
**Validates: Requirements 13.3**

Property 54: Pro plan alert limit removal
*For any* user with Pro Plan, they should be able to create unlimited alerts without quantity restrictions
**Validates: Requirements 13.4**

Property 55: Pro plan notification immediacy
*For any* user with Pro Plan, notifications should be sent immediately without delay
**Validates: Requirements 13.5**

Property 56: Merchant Pro verified badge
*For any* merchant with Merchant Pro subscription, a verified badge should be added to their profile
**Validates: Requirements 14.2**

Property 57: Merchant Pro directory listing
*For any* merchant with Merchant Pro status, they should appear in the trusted sources directory
**Validates: Requirements 14.3**

Property 58: Merchant Pro rate limit exemption
*For any* merchant with Merchant Pro status, price submissions should not be rate limited
**Validates: Requirements 14.4**

Property 59: Merchant Pro analytics availability
*For any* merchant with Merchant Pro status, analytics including average deviation and accuracy percentage should be provided
**Validates: Requirements 14.5**

### Voting System Properties

Property 60: Vote persistence
*For any* vote cast on a price submission, it should be stored with user identifier and timestamp and be retrievable
**Validates: Requirements 15.2**

Property 61: Downvote flagging threshold
*For any* price submission with more than 5 downvotes, it should be flagged as suspicious
**Validates: Requirements 15.3**

Property 62: Upvote weight increase
*For any* price submission with more than 10 upvotes, its weight should be increased by 1.5x
**Validates: Requirements 15.4**

Property 63: Vote uniqueness constraint
*For any* user-submission pair, only one vote should be allowed (no duplicate votes)
**Validates: Requirements 15.5**

### Error Handling Properties

Property 64: Database error logging
*For any* database operation failure, an error should be logged with full context and a user-friendly error message should be returned
**Validates: Requirements 16.4**

Property 65: Transaction atomicity
*For any* operation that modifies multiple related records, it should be executed within a database transaction
**Validates: Requirements 16.5**

Property 66: Unhandled error recovery
*For any* unhandled error during message processing, the error should be logged with stack trace and a generic error message should be sent to the user
**Validates: Requirements 18.1**

Property 67: Validation error specificity
*For any* invalid user input, a specific error message explaining the validation failure should be returned
**Validates: Requirements 18.2**

Property 68: Database timeout retry
*For any* database query timeout, the system should retry once before returning an error to the user
**Validates: Requirements 18.3**

Property 69: API failure graceful degradation
*For any* external API unavailability, the system should continue operating with cached data and log the API failure
**Validates: Requirements 18.4**

Property 70: Rate limiting enforcement
*For any* user exceeding 30 requests per minute, subsequent requests should be rejected
**Validates: Requirements 18.5**

### Merchant Directory Properties

Property 71: Trusted merchant filtering
*For any* trusted merchants list request, only merchants with trusted status should be returned
**Validates: Requirements 19.1**

Property 72: Merchant display content
*For any* merchant display, it should include merchant name, reputation score, and total submissions count
**Validates: Requirements 19.2**

Property 73: Merchant list sorting
*For any* merchant list display, merchants should be sorted by reputation score in descending order
**Validates: Requirements 19.3**

Property 74: Merchant Pro badge display
*For any* merchant with Merchant Pro status, a verified badge should be displayed next to their name
**Validates: Requirements 19.4**

Property 75: Merchant detail statistics
*For any* merchant detail view, it should include accuracy rate and submission history
**Validates: Requirements 19.5**

### Authentication Properties

Property 76: New user account creation
*For any* new user starting the bot, a user account should be created with their Telegram user identifier
**Validates: Requirements 20.1**

Property 77: Session validation
*For any* user interaction with the bot, the session should be validated before processing requests
**Validates: Requirements 20.2**

Property 78: Session expiration time
*For any* created session, the expiration time should be 30 days from creation
**Validates: Requirements 20.3**

Property 79: Expired session handling
*For any* expired session, the user should be prompted to restart the bot to create a new session
**Validates: Requirements 20.4**

### Authorization Properties

Property 80: Admin dashboard authentication
*For any* admin dashboard access attempt, the user should be authenticated using Better Auth
**Validates: Requirements 21.2**

Property 81: Non-admin access denial
*For any* user without administrator role attempting to access the admin dashboard, HTTP 403 Forbidden should be returned
**Validates: Requirements 21.3**

Property 82: Admin route protection
*For any* admin dashboard route, Better Auth middleware requiring administrator role should protect it
**Validates: Requirements 21.5**

Property 83: Default user role assignment
*For any* new account, the role should be assigned as USER by default
**Validates: Requirements 28.1**

Property 84: Merchant role requirement for price submission
*For any* user without merchant role attempting to submit a price, the request should be rejected with an authorization error
**Validates: Requirements 28.2**

Property 85: Admin role requirement for admin commands
*For any* user without administrator role attempting to access admin commands, the request should be rejected with an authorization error
**Validates: Requirements 28.3**

Property 86: Role change immediacy
*For any* administrator changing a user's role, the change should take effect immediately
**Validates: Requirements 28.5**

### UI/UX Properties

Property 87: Inline message updates
*For any* menu option selection, the message should update inline without sending new messages
**Validates: Requirements 29.3**

Property 88: Emoji button presence
*For any* inline keyboard, emoji icons should be present in all buttons
**Validates: Requirements 29.4**

Property 89: Pagination button presence
*For any* paginated list display, Previous and Next buttons should be included
**Validates: Requirements 29.5**

Property 90: Conversation progress indicators
*For any* conversation step, progress indicators showing current step and total steps should be displayed
**Validates: Requirements 30.3**

Property 91: Conversation error recovery
*For any* invalid input during a conversation, an error message should be displayed and the conversation should continue without restarting
**Validates: Requirements 30.4**

Property 92: Conversation completion summary
*For any* completed conversation, a summary of configured parameters with confirmation buttons should be displayed
**Validates: Requirements 30.5**

Property 93: Command parameter parsing
*For any* command with parameters, the parameters should be parsed correctly
**Validates: Requirements 34.3**

Property 94: Invalid command suggestions
*For any* unrecognized command, similar valid commands should be suggested
**Validates: Requirements 34.4**

Property 95: Operation failure error display
*For any* failed operation with a loading indicator, the loading indicator should be replaced with an error message
**Validates: Requirements 35.5**

Property 96: Conversation idle timeout prompt
*For any* conversation idle for 60 seconds, a helpful prompt with suggested next actions should be sent
**Validates: Requirements 36.5**


## Error Handling

### Error Categories

**1. User Input Errors**
- Invalid command parameters
- Invalid alert parameters
- Invalid price submission format
- Response: Specific validation error message with examples

**2. Authentication/Authorization Errors**
- Expired session
- Insufficient permissions
- Deactivated account
- Response: Clear error message with instructions to resolve

**3. Database Errors**
- Connection failures
- Query timeouts
- Transaction failures
- Response: Retry once, then return user-friendly error message

**4. External API Errors**
- API unavailable
- Rate limit exceeded
- Invalid response
- Response: Use cached data, log error, continue operation

**5. System Errors**
- Unhandled exceptions
- Memory issues
- Configuration errors
- Response: Log with stack trace, send generic error message to user

### Error Handling Strategy

```typescript
// Global error handler middleware
bot.catch((err, ctx) => {
  logger.error('Unhandled error', {
    error: err,
    userId: ctx.from?.id,
    updateType: ctx.update.update_id,
    stack: err.stack
  });
  
  const errorMessage = ctx.t('error.generic', {
    errorId: generateErrorId()
  });
  
  const keyboard = new InlineKeyboard()
    .text(ctx.t('help'), 'help')
    .text(ctx.t('contact_support'), 'support');
  
  ctx.reply(errorMessage, { reply_markup: keyboard });
});

// Specific error handlers
async function handleDatabaseError(error: Error, ctx: BotContext) {
  if (error.name === 'QueryTimeout') {
    // Retry once
    try {
      return await retryOperation();
    } catch (retryError) {
      logger.error('Database retry failed', { error: retryError });
      return ctx.reply(ctx.t('error.database_unavailable'));
    }
  }
  
  logger.error('Database error', { error });
  return ctx.reply(ctx.t('error.database'));
}

async function handleAPIError(error: Error, apiName: string) {
  logger.warn('API error', { api: apiName, error });
  
  // Use cached data
  const cachedData = await cache.get(apiName);
  if (cachedData) {
    return cachedData;
  }
  
  // Continue without this data source
  return null;
}
```

### Rate Limiting

```typescript
const rateLimiter = new Map<string, RateLimitData>();

interface RateLimitData {
  count: number;
  resetAt: Date;
}

async function rateLimitMiddleware(ctx: BotContext, next: NextFunction) {
  const userId = ctx.from?.id.toString();
  if (!userId) return next();
  
  const now = new Date();
  const limitData = rateLimiter.get(userId);
  
  if (!limitData || limitData.resetAt < now) {
    rateLimiter.set(userId, {
      count: 1,
      resetAt: new Date(now.getTime() + 60000) // 1 minute
    });
    return next();
  }
  
  if (limitData.count >= 30) {
    return ctx.reply(ctx.t('error.rate_limit'));
  }
  
  limitData.count++;
  return next();
}
```

## Testing Strategy

### Unit Testing

**Framework**: Jest with TypeScript support

**Coverage Areas:**
- Service layer methods (price calculation, reputation scoring, trend detection)
- Validation functions (alert parameters, price submissions)
- Utility functions (formatting, calculations)
- Database queries (using Prisma mock)
- Error handling logic

**Example Unit Tests:**

```typescript
describe('PriceService', () => {
  describe('calculateAggregatedPrice', () => {
    it('should calculate weighted average correctly', async () => {
      const submissions = [
        { value: 100, isTrusted: true },  // weight 2.0
        { value: 110, isTrusted: false }, // weight 1.0
        { value: 105, isTrusted: true }   // weight 2.0
      ];
      
      const result = await priceService.calculateAggregatedPrice('usd', submissions);
      
      // (100*2 + 110*1 + 105*2) / (2+1+2) = 515/5 = 103
      expect(result.price).toBe(103);
    });
    
    it('should mark as low confidence when fewer than 3 submissions', async () => {
      const submissions = [
        { value: 100, isTrusted: true },
        { value: 110, isTrusted: false }
      ];
      
      const result = await priceService.calculateAggregatedPrice('usd', submissions);
      
      expect(result.confidence).toBe('low');
    });
  });
});

describe('ReputationService', () => {
  it('should calculate reputation score correctly', () => {
    const merchant = {
      totalSubmissions: 100,
      accurateSubmissions: 87
    };
    
    const score = reputationService.calculateReputation(merchant);
    
    expect(score).toBe(87);
  });
  
  it('should grant trusted status when score exceeds 85', () => {
    const merchant = { reputationScore: 86 };
    
    const isTrusted = reputationService.shouldBeTrusted(merchant);
    
    expect(isTrusted).toBe(true);
  });
});
```

### Property-Based Testing

**Framework**: fast-check (TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Property Test Implementation:**

Each property-based test MUST be tagged with a comment explicitly referencing the correctness property in the design document using this exact format: `**Feature: telegram-financial-alerts-bot, Property {number}: {property_text}**`

**Example Property Tests:**

```typescript
import fc from 'fast-check';

describe('Property-Based Tests', () => {
  /**
   * Feature: telegram-financial-alerts-bot, Property 2: Localized message consistency
   * For any user with a stored language preference, all messages sent to that user should be in that language
   */
  it('should send all messages in user preferred language', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.string(),
          language: fc.constantFrom('en', 'ar'),
          messageCount: fc.integer({ min: 1, max: 10 })
        }),
        async ({ userId, language, messageCount }) => {
          // Setup user with language preference
          await userService.setLanguage(userId, language);
          
          // Send multiple messages
          const messages = [];
          for (let i = 0; i < messageCount; i++) {
            const msg = await messageService.formatMessage(userId, 'test_key');
            messages.push(msg);
          }
          
          // All messages should be in the same language
          const allInCorrectLanguage = messages.every(msg => 
            msg.language === language
          );
          
          expect(allInCorrectLanguage).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: telegram-financial-alerts-bot, Property 6: Suspicious price flagging
   * For any price submission that deviates more than 10% from the recent average, the submission should be flagged as suspicious
   */
  it('should flag submissions deviating more than 10%', () => {
    fc.assert(
      fc.property(
        fc.record({
          recentAverage: fc.float({ min: 1, max: 100000 }),
          deviationPercent: fc.float({ min: 10.1, max: 50 })
        }),
        async ({ recentAverage, deviationPercent }) => {
          const submittedValue = recentAverage * (1 + deviationPercent / 100);
          
          const result = await priceService.validateSubmission({
            asset: 'usd',
            value: submittedValue,
            recentAverage
          });
          
          expect(result.isSuspicious).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: telegram-financial-alerts-bot, Property 13: Reputation score calculation
   * For any merchant, the reputation score should equal (accurate_submissions / total_submissions) × 100
   */
  it('should calculate reputation score correctly for any merchant', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalSubmissions: fc.integer({ min: 1, max: 10000 }),
          accurateSubmissions: fc.integer({ min: 0, max: 10000 })
        }).filter(({ totalSubmissions, accurateSubmissions }) => 
          accurateSubmissions <= totalSubmissions
        ),
        ({ totalSubmissions, accurateSubmissions }) => {
          const expectedScore = (accurateSubmissions / totalSubmissions) * 100;
          
          const calculatedScore = reputationService.calculateScore({
            totalSubmissions,
            accurateSubmissions
          });
          
          expect(calculatedScore).toBeCloseTo(expectedScore, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: telegram-financial-alerts-bot, Property 18: Weighted average calculation
   * For any set of valid submissions, the aggregated price should equal the weighted average where trusted merchant submissions have weight 2.0 and regular submissions have weight 1.0
   */
  it('should calculate weighted average correctly for any submission set', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            value: fc.float({ min: 1, max: 100000 }),
            isTrusted: fc.boolean()
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (submissions) => {
          const expectedPrice = submissions.reduce((sum, sub) => {
            const weight = sub.isTrusted ? 2.0 : 1.0;
            return sum + (sub.value * weight);
          }, 0) / submissions.reduce((sum, sub) => {
            return sum + (sub.isTrusted ? 2.0 : 1.0);
          }, 0);
          
          const calculatedPrice = priceService.calculateWeightedAverage(submissions);
          
          expect(calculatedPrice).toBeCloseTo(expectedPrice, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: telegram-financial-alerts-bot, Property 63: Vote uniqueness constraint
   * For any user-submission pair, only one vote should be allowed (no duplicate votes)
   */
  it('should prevent duplicate votes for any user-submission pair', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.string(),
          submissionId: fc.string(),
          voteType: fc.boolean() // true = upvote, false = downvote
        }),
        async ({ userId, submissionId, voteType }) => {
          // First vote should succeed
          const firstVote = await voteService.castVote(userId, submissionId, voteType);
          expect(firstVote.success).toBe(true);
          
          // Second vote should fail
          const secondVote = await voteService.castVote(userId, submissionId, !voteType);
          expect(secondVote.success).toBe(false);
          expect(secondVote.error).toBe('DUPLICATE_VOTE');
          
          // Verify only one vote exists
          const votes = await voteService.getVotes(submissionId);
          const userVotes = votes.filter(v => v.userId === userId);
          expect(userVotes.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Framework**: Jest with Supertest for API testing

**Coverage Areas:**
- Bot command flows (start, help, price, alerts)
- Conversation flows (alert creation, settings)
- Admin dashboard endpoints
- Webhook handling
- Database integration
- External API integration (with mocks)

**Example Integration Tests:**

```typescript
describe('Bot Integration Tests', () => {
  it('should complete alert creation flow', async () => {
    const bot = await createTestBot();
    const user = await createTestUser();
    
    // Start alert creation
    await bot.sendCommand(user, '/alerts');
    await bot.clickButton(user, 'create_alert');
    
    // Select asset
    await bot.clickButton(user, 'asset:usd');
    
    // Select type
    await bot.clickButton(user, 'type:threshold');
    
    // Enter threshold
    await bot.sendMessage(user, '15500');
    
    // Select direction
    await bot.clickButton(user, 'direction:above');
    
    // Confirm
    await bot.clickButton(user, 'confirm');
    
    // Verify alert created
    const alerts = await alertService.getUserAlerts(user.id);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('threshold');
    expect(alerts[0].parameters.value).toBe(15500);
  });
});

describe('Admin Dashboard Integration Tests', () => {
  it('should require admin role for dashboard access', async () => {
    const regularUser = await createTestUser({ role: 'USER' });
    
    const response = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${regularUser.token}`);
    
    expect(response.status).toBe(403);
  });
  
  it('should allow admin to flag merchant', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const merchant = await createTestMerchant();
    
    const response = await request(app)
      .post(`/admin/merchants/${merchant.id}/flag`)
      .set('Authorization', `Bearer ${admin.token}`);
    
    expect(response.status).toBe(200);
    
    const updatedMerchant = await merchantService.getMerchant(merchant.id);
    expect(updatedMerchant.isFlagged).toBe(true);
  });
});
```

### End-to-End Testing

**Framework**: Playwright for browser automation (admin dashboard)

**Coverage Areas:**
- Complete user journeys
- Admin dashboard workflows
- Multi-user scenarios
- Real Telegram bot interaction (test environment)

### Test Data Generators

For property-based testing, implement smart generators that constrain to the input space intelligently:

```typescript
// Custom arbitraries for domain-specific data
const priceSubmissionArbitrary = fc.record({
  asset: fc.constantFrom('usd', 'gold', 'btc'),
  value: fc.float({ min: 0.01, max: 1000000, noNaN: true }),
  timestamp: fc.date({ min: new Date(Date.now() - 86400000) }), // last 24h
  isTrusted: fc.boolean()
});

const alertParametersArbitrary = fc.oneof(
  // Threshold alert
  fc.record({
    type: fc.constant('threshold'),
    value: fc.float({ min: 0.01, max: 1000000 }),
    direction: fc.constantFrom('above', 'below')
  }),
  // Movement alert
  fc.record({
    type: fc.constant('movement'),
    percentage: fc.float({ min: 0.1, max: 50 }),
    timeWindowMinutes: fc.integer({ min: 1, max: 1440 })
  }),
  // Zone alert
  fc.record({
    type: fc.constant('zone'),
    min: fc.float({ min: 0.01, max: 500000 }),
    max: fc.float({ min: 0.01, max: 1000000 })
  }).filter(({ min, max }) => min < max)
);
```

## Deployment Configuration

### Environment Variables

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-app.onrender.com/webhook
TELEGRAM_WEBHOOK_SECRET=random_secret_string

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=https://your-app.onrender.com

# External APIs
CRYPTO_API_KEY=your_crypto_api_key
GOLD_API_KEY=your_gold_api_key
FOREX_API_KEY=your_forex_api_key

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Admin
ADMIN_TELEGRAM_IDS=123456789,987654321
```

### Render Configuration

**render.yaml:**

```yaml
services:
  - type: web
    name: market-pulse-bot
    env: node
    plan: starter
    buildCommand: yarn install && yarn build && yarn prisma:generate && yarn prisma:migrate
    startCommand: yarn start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: market-pulse-db
          property: connectionString
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: TELEGRAM_WEBHOOK_SECRET
        generateValue: true
      - key: BETTER_AUTH_SECRET
        generateValue: true
    healthCheckPath: /health
    
databases:
  - name: market-pulse-db
    plan: starter
    databaseName: market_pulse
    user: market_pulse_user

jobs:
  - type: cron
    name: price-fetcher
    schedule: "*/1 * * * *" # Every minute
    buildCommand: yarn install
    startCommand: yarn job:fetch-prices
    
  - type: cron
    name: price-calculator
    schedule: "*/1 * * * *" # Every minute
    buildCommand: yarn install
    startCommand: yarn job:calculate-prices
    
  - type: cron
    name: alert-monitor
    schedule: "*/1 * * * *" # Every minute
    buildCommand: yarn install
    startCommand: yarn job:monitor-alerts
    
  - type: cron
    name: report-generator
    schedule: "0 20 * * *" # Daily at 8 PM
    buildCommand: yarn install
    startCommand: yarn job:generate-reports
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "job:fetch-prices": "tsx src/jobs/fetch-prices.ts",
    "job:calculate-prices": "tsx src/jobs/calculate-prices.ts",
    "job:monitor-alerts": "tsx src/jobs/monitor-alerts.ts",
    "job:generate-reports": "tsx src/jobs/generate-reports.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

## Project Structure

```
market-pulse-bot/
├── src/
│   ├── index.ts                 # Application entry point
│   ├── bot/
│   │   ├── index.ts             # Bot initialization
│   │   ├── middleware/
│   │   │   ├── auth.ts          # Authentication middleware
│   │   │   ├── i18n.ts          # Localization middleware
│   │   │   ├── rate-limit.ts    # Rate limiting middleware
│   │   │   └── error.ts         # Error handling middleware
│   │   ├── commands/
│   │   │   ├── start.ts         # /start command
│   │   │   ├── help.ts          # /help command
│   │   │   ├── price.ts         # /price command
│   │   │   ├── alerts.ts        # /alerts command
│   │   │   ├── settings.ts      # /settings command
│   │   │   ├── submit.ts        # /submit command (merchants)
│   │   │   └── admin.ts         # /admin command (admins)
│   │   ├── conversations/
│   │   │   ├── create-alert.ts  # Alert creation flow
│   │   │   ├── edit-alert.ts    # Alert editing flow
│   │   │   └── settings.ts      # Settings flow
│   │   ├── menus/
│   │   │   ├── main.ts          # Main menu
│   │   │   ├── prices.ts        # Prices menu
│   │   │   └── alerts.ts        # Alerts menu
│   │   └── handlers/
│   │       ├── callback.ts      # Callback query handlers
│   │       └── inline.ts        # Inline query handlers
│   ├── services/
│   │   ├── auth.service.ts      # Authentication service
│   │   ├── price.service.ts     # Price service
│   │   ├── alert.service.ts     # Alert service
│   │   ├── reputation.service.ts # Reputation service
│   │   ├── trend.service.ts     # Trend detection service
│   │   └── notification.service.ts # Notification service
│   ├── jobs/
│   │   ├── fetch-prices.ts      # Price fetcher job
│   │   ├── calculate-prices.ts  # Price calculator job
│   │   ├── monitor-alerts.ts    # Alert monitor job
│   │   └── generate-reports.ts  # Report generator job
│   ├── admin/
│   │   ├── routes.ts            # Admin dashboard routes
│   │   ├── controllers/
│   │   │   ├── dashboard.ts     # Dashboard controller
│   │   │   ├── users.ts         # User management controller
│   │   │   ├── merchants.ts     # Merchant management controller
│   │   │   ├── submissions.ts   # Submission audit controller
│   │   │   └── logs.ts          # Logs controller
│   │   └── views/
│   │       └── ... (HTML templates or React components)
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client instance
│   │   ├── logger.ts            # Logger configuration
│   │   ├── cache.ts             # Cache implementation
│   │   └── utils.ts             # Utility functions
│   ├── types/
│   │   ├── bot.ts               # Bot context types
│   │   ├── services.ts          # Service types
│   │   └── models.ts            # Domain model types
│   └── locales/
│       ├── en.json              # English translations
│       └── ar.json              # Arabic translations
├── prisma/
│   ├── schema.prisma            # Prisma schema
│   └── migrations/              # Database migrations
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── property/                # Property-based tests
│   └── e2e/                     # End-to-end tests
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest configuration
├── render.yaml                  # Render deployment config
└── README.md                    # Project documentation
```

## Security Considerations

1. **Authentication**: All user sessions managed by Better Auth with 30-day expiration
2. **Authorization**: Role-based access control for all operations
3. **Input Validation**: All user inputs validated before processing
4. **SQL Injection**: Prevented by Prisma ORM parameterized queries
5. **Rate Limiting**: 30 requests per user per minute
6. **Environment Variables**: Sensitive data stored in environment variables
7. **HTTPS**: All communication over HTTPS (Telegram webhook, admin dashboard)
8. **Session Security**: Secure session tokens with httpOnly cookies
9. **Admin Access**: Admin dashboard protected by Better Auth with role verification
10. **Data Privacy**: User data encrypted at rest in Neon Postgres

## Performance Optimization

1. **Database Indexing**: Indexes on frequently queried fields (userId, asset, timestamp)
2. **Connection Pooling**: Prisma connection pooling for database efficiency
3. **Caching**: Redis cache for aggregated prices and frequently accessed data
4. **Batch Operations**: Bulk notifications sent in batches
5. **Lazy Loading**: Paginated lists for large datasets
6. **Webhook Mode**: Telegram webhook instead of polling for lower latency
7. **Background Jobs**: Heavy operations (price calculation, trend detection) run in background
8. **Query Optimization**: Efficient Prisma queries with selective field loading
9. **CDN**: Static assets served via CDN
10. **Serverless Database**: Neon Postgres auto-scales with demand

## Monitoring and Logging

1. **Structured Logging**: Winston logger with JSON format
2. **Log Levels**: INFO, WARNING, ERROR with appropriate usage
3. **Error Tracking**: Sentry integration for error monitoring
4. **Performance Metrics**: Response time tracking for all operations
5. **Health Checks**: /health endpoint for uptime monitoring
6. **Database Monitoring**: Prisma query logging in development
7. **Alert Monitoring**: Track alert trigger rates and notification delivery
8. **API Monitoring**: Track external API success/failure rates
9. **User Analytics**: Track user engagement and feature usage
10. **Admin Audit Log**: All admin actions logged with timestamp and user

## Future Enhancements

1. **Market Charts**: Historical price charts using Chart.js
2. **Advanced Analytics**: Machine learning for price prediction
3. **Multi-Currency Support**: Support for more currencies and commodities
4. **Social Features**: User groups and shared watchlists
5. **Mobile App**: Native mobile app for iOS and Android
6. **API Access**: Public API for third-party integrations
7. **Webhook Alerts**: Send alerts to external webhooks
8. **Custom Indicators**: User-defined technical indicators
9. **News Integration**: Aggregate financial news related to tracked assets
10. **Voice Alerts**: Voice message notifications for critical alerts
