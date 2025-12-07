# Implementation Plan

- [x] 1. Set up project structure and core dependencies



  - Initialize Node.js project with TypeScript and Yarn
  - Install core dependencies (GrammyJS, Prisma, Better Auth, ExpressJS)
  - Configure TypeScript with strict mode
  - Set up project folder structure (src/, prisma/, tests/, locales/)
  - Create .env.example with all required environment variables
  - _Requirements: 16.1, 17.1, 33.1, 33.2_

- [ ] 2. Configure Prisma and database schema
  - Initialize Prisma with Neon Postgres provider
  - Define complete Prisma schema with Better Auth tables (User, Session, Account, Verification)
  - Add application-specific models (Merchant, PriceSubmission, Alert, etc.)
  - Create initial migration
  - Generate Prisma client
  - _Requirements: 16.1, 16.2, 20.1, 20.5_

- [ ] 3. Set up Better Auth configuration
  - Configure Better Auth with Prisma adapter
  - Enable admin plugin for role-based access control
  - Configure session management (30-day expiration)
  - Set up Telegram-based authentication flow
  - Create auth utility functions for Telegram user creation
  - _Requirements: 20.1, 20.2, 20.3, 20.5, 28.1_

- [ ]* 3.1 Write property test for session expiration
  - **Property 78: Session expiration time**
  - **Validates: Requirements 20.3**

- [ ] 4. Initialize ExpressJS server and health check
  - Set up ExpressJS server with TypeScript
  - Create /health endpoint returning status 200
  - Configure middleware (CORS, body parser, error handling)
  - Set up graceful shutdown on SIGTERM
  - _Requirements: 17.1, 17.2, 17.5_

- [ ] 5. Initialize Grammy bot with core middleware
  - Create Grammy bot instance with TypeScript context
  - Implement authentication middleware (Better Auth session validation)
  - Implement rate limiting middleware (30 requests/minute)
  - Implement error handling middleware
  - Set up webhook mode for Telegram
  - _Requirements: 18.5, 20.2, 28.4_

- [ ]* 5.1 Write property test for rate limiting
  - **Property 70: Rate limiting enforcement**
  - **Validates: Requirements 18.5**

- [ ] 6. Set up localization with Grammy i18n plugin
  - Install and configure @grammyjs/i18n plugin
  - Create locales directory with en.json and ar.json
  - Implement language selection on first start
  - Create i18n middleware for loading user language preference
  - Add translation keys for all user-facing text
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 6.1 Write property test for language persistence
  - **Property 1: Language preference persistence**
  - **Validates: Requirements 1.2**

- [ ]* 6.2 Write property test for localized messages
  - **Property 2: Localized message consistency**
  - **Validates: Requirements 1.3**

- [ ] 7. Implement authentication service
  - Create AuthService class with Better Auth integration
  - Implement createUserFromTelegram method
  - Implement session creation and validation
  - Implement role management methods (getUserRole, updateUserRole)
  - Implement ban management methods (banUser, unbanUser)
  - _Requirements: 20.1, 20.2, 20.4, 28.1, 28.5_

- [ ]* 7.1 Write property test for default user role
  - **Property 83: Default user role assignment**
  - **Validates: Requirements 28.1**

- [ ]* 7.2 Write property test for role change immediacy
  - **Property 86: Role change immediacy**
  - **Validates: Requirements 28.5**

- [ ] 8. Implement /start command with language selection
  - Create start command handler
  - Display welcome message with inline keyboard for language selection
  - Handle language selection callback
  - Create or retrieve user account using Better Auth
  - Store language preference in user profile
  - _Requirements: 1.1, 1.2, 20.1, 34.1_

- [ ] 9. Implement main menu with Grammy Menu plugin
  - Install @grammyjs/menu plugin
  - Create main menu with inline keyboard (View Prices, Manage Alerts, Settings, Help)
  - Implement menu navigation with emoji icons
  - Add inline message updates (no new messages)
  - _Requirements: 29.1, 29.2, 29.3, 29.4_

- [ ]* 9.1 Write property test for inline message updates
  - **Property 87: Inline message updates**
  - **Validates: Requirements 29.3**

- [ ]* 9.2 Write property test for emoji button presence
  - **Property 88: Emoji button presence**
  - **Validates: Requirements 29.4**

- [ ] 10. Implement price service
  - Create PriceService class
  - Implement submitPrice method with format validation
  - Implement price submission storage with timestamp
  - Implement deviation check (±10% from recent average)
  - Implement suspicious price flagging
  - Implement getAggregatedPrice method
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4_

- [ ]* 10.1 Write property test for price submission validation
  - **Property 4: Price submission format validation**
  - **Validates: Requirements 2.1**

- [ ]* 10.2 Write property test for price submission round-trip
  - **Property 5: Price submission round-trip**
  - **Validates: Requirements 2.2**

- [ ]* 10.3 Write property test for suspicious price flagging
  - **Property 6: Suspicious price flagging**
  - **Validates: Requirements 2.3**

- [ ]* 10.4 Write property test for suspicious price exclusion
  - **Property 7: Suspicious price exclusion**
  - **Validates: Requirements 2.4**

- [ ]* 10.5 Write property test for weighted average calculation
  - **Property 18: Weighted average calculation**
  - **Validates: Requirements 5.3**

- [ ]* 10.6 Write property test for low confidence marking
  - **Property 19: Low confidence marking**
  - **Validates: Requirements 5.4**

- [ ] 11. Implement reputation service
  - Create ReputationService class
  - Implement calculateReputation method (accurate/total × 100)
  - Implement updateReputationAfterSubmission method
  - Implement trusted status grant/revoke logic (85% threshold for grant, 70% for revoke)
  - Implement getMerchantStats method
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 11.1 Write property test for reputation score calculation
  - **Property 13: Reputation score calculation**
  - **Validates: Requirements 4.3**

- [ ]* 11.2 Write property test for trusted status grant
  - **Property 14: Trusted status grant threshold**
  - **Validates: Requirements 4.4**

- [ ]* 11.3 Write property test for trusted status revocation
  - **Property 15: Trusted status revocation threshold**
  - **Validates: Requirements 4.5**

- [ ] 12. Implement external API price fetcher
  - Create API client for cryptocurrency prices (e.g., CoinGecko)
  - Create API client for gold prices (e.g., Metals API)
  - Create API client for forex rates (e.g., ExchangeRate-API)
  - Implement error handling with logging and retry logic
  - Store fetched prices with source identifier and timestamp
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 12.1 Write property test for API data persistence
  - **Property 9: API data persistence**
  - **Validates: Requirements 3.5**

- [ ]* 12.2 Write property test for API error logging
  - **Property 10: API error logging**
  - **Validates: Requirements 3.4**

- [ ] 13. Implement /price command with interactive display
  - Create price command handler with optional asset parameter
  - Fetch and display aggregated market price
  - Format message with MarkdownV2/HTML (price, trend, high/low, spread, merchant count)
  - Add inline keyboard with quick actions (Set Alert, Refresh, View History)
  - Implement refresh callback to update price inline
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 31.1, 31.2, 32.1, 32.2, 34.1, 34.3_

- [ ]* 13.1 Write property test for price display content
  - **Property 45: Price display content - basic fields**
  - **Validates: Requirements 11.2**

- [ ]* 13.2 Write property test for price spread calculation
  - **Property 48: Price spread calculation**
  - **Validates: Requirements 11.5**

- [ ] 14. Implement alert service
  - Create AlertService class
  - Implement createAlert method with parameter validation
  - Implement alert persistence with user identifier
  - Implement getUserAlerts method
  - Implement updateAlert, deleteAlert, toggleAlert methods
  - Implement enforceAlertLimits for Free plan (3 alerts max)
  - _Requirements: 6.1, 6.2, 6.5, 7.1, 7.2, 7.5, 8.1, 8.2, 8.5, 12.1, 12.3, 12.4, 12.5_

- [ ]* 14.1 Write property test for threshold alert validation
  - **Property 20: Threshold alert parameter validation**
  - **Validates: Requirements 6.1**

- [ ]* 14.2 Write property test for threshold alert persistence
  - **Property 21: Threshold alert persistence**
  - **Validates: Requirements 6.2**

- [ ]* 14.3 Write property test for free plan alert limit
  - **Property 24: Free plan alert limit**
  - **Validates: Requirements 6.5**

- [ ]* 14.4 Write property test for zone alert validation
  - **Property 30: Zone alert parameter validation**
  - **Validates: Requirements 8.1**

- [ ]* 14.5 Write property test for alert deletion persistence
  - **Property 50: Alert deletion persistence**
  - **Validates: Requirements 12.3**

- [ ] 15. Implement alert creation conversation with Grammy Conversations plugin
  - Install @grammyjs/conversations plugin
  - Create createAlertConversation with multi-step flow
  - Step 1: Select asset (USD, Gold, BTC) with inline keyboard
  - Step 2: Select alert type (Threshold, Movement, Zone, Trend) with inline keyboard
  - Step 3-N: Collect parameters based on type (threshold value, percentage, time window, zone boundaries)
  - Display progress indicators (current step / total steps)
  - Handle invalid input with error messages and retry (no restart)
  - Display summary with confirmation buttons
  - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5_

- [ ]* 15.1 Write property test for conversation progress indicators
  - **Property 90: Conversation progress indicators**
  - **Validates: Requirements 30.3**

- [ ]* 15.2 Write property test for conversation error recovery
  - **Property 91: Conversation error recovery**
  - **Validates: Requirements 30.4**

- [ ]* 15.3 Write property test for conversation completion summary
  - **Property 92: Conversation completion summary**
  - **Validates: Requirements 30.5**

- [ ] 16. Implement /alerts command and dashboard
  - Create alerts command handler
  - Display all active alerts with type, asset, and parameters
  - Add inline keyboard with options (Create, Edit, Delete, Toggle)
  - Implement pagination with Previous/Next buttons for long lists
  - Handle edit, delete, and toggle callbacks
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 29.5, 34.1_

- [ ]* 16.1 Write property test for dashboard alert listing
  - **Property 49: Dashboard alert listing**
  - **Validates: Requirements 12.1**

- [ ]* 16.2 Write property test for pagination buttons
  - **Property 89: Pagination button presence**
  - **Validates: Requirements 29.5**

- [ ] 17. Implement trend detection service
  - Create TrendDetectionService class
  - Implement detectTrend method (3 consecutive intervals, >2% change)
  - Implement detectVolatility method (std dev > 3% of mean for 10 prices)
  - Implement detectReversal method (trend change after 5+ intervals)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 17.1 Write property test for uptrend detection
  - **Property 35: Uptrend detection**
  - **Validates: Requirements 9.1**

- [ ]* 17.2 Write property test for downtrend detection
  - **Property 36: Downtrend detection**
  - **Validates: Requirements 9.2**

- [ ]* 17.3 Write property test for volatility detection
  - **Property 37: High volatility detection**
  - **Validates: Requirements 9.3**

- [ ]* 17.4 Write property test for reversal detection
  - **Property 38: Market reversal detection**
  - **Validates: Requirements 9.4**

- [ ] 18. Implement notification service
  - Create NotificationService class
  - Implement sendAlertNotification method with formatted messages
  - Implement sendDailyReport method
  - Apply notification delays for Free plan users (5-10 minutes)
  - Format messages with emoji indicators and MarkdownV2
  - _Requirements: 6.3, 6.4, 7.3, 7.4, 8.3, 8.4, 9.5, 10.2, 10.3, 10.4, 13.4, 13.5, 31.1, 31.3, 31.4_

- [ ]* 18.1 Write property test for threshold notification content
  - **Property 23: Threshold notification content**
  - **Validates: Requirements 6.4**

- [ ]* 18.2 Write property test for Pro plan notification immediacy
  - **Property 55: Pro plan notification immediacy**
  - **Validates: Requirements 13.5**

- [ ] 19. Implement background job: Price fetcher
  - Create price fetcher job (runs every 60 seconds for crypto/forex, 300 seconds for gold)
  - Fetch prices from all configured APIs
  - Store fetched prices in database
  - Handle API failures gracefully with logging
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 20. Implement background job: Price calculator
  - Create price calculator job (runs every 30 seconds)
  - Calculate aggregated market price for all assets
  - Apply time-based filtering (last 600 seconds)
  - Exclude suspicious submissions
  - Apply weighted average (trusted merchants weight 2.0, regular 1.0)
  - Mark low confidence when < 3 submissions
  - Update AggregatedPrice records
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 20.1 Write property test for time-based filtering
  - **Property 16: Time-based submission filtering**
  - **Validates: Requirements 5.1**

- [ ] 21. Implement background job: Alert monitor
  - Create alert monitor job (runs every 30 seconds)
  - Check all active alerts against new prices
  - Detect threshold crossings
  - Detect movement alerts (percentage change in time window)
  - Detect zone entries
  - Detect trend patterns
  - Queue notifications via NotificationService
  - _Requirements: 6.3, 7.3, 8.3, 9.5_

- [ ]* 21.1 Write property test for threshold alert triggering
  - **Property 22: Threshold alert triggering**
  - **Validates: Requirements 6.3**

- [ ]* 21.2 Write property test for zone alert triggering
  - **Property 32: Zone alert triggering**
  - **Validates: Requirements 8.3**

- [ ] 22. Implement background job: Report generator
  - Create report generator job (runs daily at 20:00)
  - Generate daily reports for Pro plan users
  - Calculate high, low, open, close prices
  - Calculate overall trend and volatility
  - Send reports via NotificationService
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 22.1 Write property test for daily report content
  - **Property 40: Daily report content completeness**
  - **Validates: Requirements 10.2**

- [ ]* 22.2 Write property test for free plan report restriction
  - **Property 43: Free plan report restriction**
  - **Validates: Requirements 10.5**

- [ ] 23. Implement voting system
  - Add voting UI to price submission displays (👍/👎 buttons)
  - Implement vote casting with uniqueness constraint
  - Implement downvote flagging (>5 downvotes = suspicious)
  - Implement upvote weight increase (>10 upvotes = 1.5x weight)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 23.1 Write property test for vote persistence
  - **Property 60: Vote persistence**
  - **Validates: Requirements 15.2**

- [ ]* 23.2 Write property test for vote uniqueness
  - **Property 63: Vote uniqueness constraint**
  - **Validates: Requirements 15.5**

- [ ]* 23.3 Write property test for downvote flagging
  - **Property 61: Downvote flagging threshold**
  - **Validates: Requirements 15.3**

- [ ] 24. Implement merchant system
  - Create Merchant profile model and service
  - Implement /submit command for merchants (role check)
  - Display merchant statistics (reputation, accuracy, submissions)
  - Implement trusted merchants list with sorting by reputation
  - Display verified badge for Merchant Pro users
  - _Requirements: 2.1, 2.2, 2.5, 19.1, 19.2, 19.3, 19.4, 19.5, 28.2_

- [ ]* 24.1 Write property test for merchant role requirement
  - **Property 84: Merchant role requirement for price submission**
  - **Validates: Requirements 28.2**

- [ ]* 24.2 Write property test for trusted merchant filtering
  - **Property 71: Trusted merchant filtering**
  - **Validates: Requirements 19.1**

- [ ]* 24.3 Write property test for merchant list sorting
  - **Property 73: Merchant list sorting**
  - **Validates: Requirements 19.3**

- [ ] 25. Implement subscription management
  - Display plan information (/upgrade command)
  - Implement Pro plan upgrade flow
  - Implement Merchant Pro upgrade flow
  - Update user plan status after payment verification
  - Remove alert limits for Pro users
  - Enable unlimited submissions for Merchant Pro
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ]* 25.1 Write property test for plan upgrade persistence
  - **Property 53: Plan upgrade persistence**
  - **Validates: Requirements 13.3**

- [ ]* 25.2 Write property test for Pro plan alert limit removal
  - **Property 54: Pro plan alert limit removal**
  - **Validates: Requirements 13.4**

- [ ]* 25.3 Write property test for Merchant Pro rate limit exemption
  - **Property 58: Merchant Pro rate limit exemption**
  - **Validates: Requirements 14.4**

- [ ] 26. Implement /help command with contextual help
  - Create help command handler
  - Display main help menu with categories (inline keyboard)
  - Implement category selection with detailed information
  - Add help buttons to error messages
  - Implement idle timeout prompts in conversations (60 seconds)
  - _Requirements: 34.1, 36.1, 36.2, 36.3, 36.4, 36.5_

- [ ]* 26.1 Write property test for conversation idle timeout
  - **Property 96: Conversation idle timeout prompt**
  - **Validates: Requirements 36.5**

- [ ] 27. Implement /settings command
  - Create settings command handler
  - Display settings menu (Language, Notifications, Plan)
  - Implement language change with immediate effect
  - Implement notification preferences
  - _Requirements: 1.4, 34.1_

- [ ]* 27.1 Write property test for language change immediacy
  - **Property 3: Language change immediacy**
  - **Validates: Requirements 1.4**

- [ ] 28. Implement command suggestions for invalid commands
  - Implement fuzzy matching for command suggestions
  - Display suggested commands when unrecognized command is sent
  - _Requirements: 34.4_

- [ ]* 28.1 Write property test for invalid command suggestions
  - **Property 94: Invalid command suggestions**
  - **Validates: Requirements 34.4**

- [ ] 29. Implement loading indicators
  - Add chat action middleware (typing indicator)
  - Display loading messages for operations > 1 second
  - Update/remove loading indicators on completion
  - Replace loading with error message on failure
  - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5_

- [ ]* 29.1 Write property test for operation failure error display
  - **Property 95: Operation failure error display**
  - **Validates: Requirements 35.5**

- [ ] 30. Implement admin dashboard routes
  - Set up admin dashboard at /admin path
  - Implement Better Auth middleware for admin routes (role check)
  - Return 403 for non-admin users
  - Create dashboard home with system statistics
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ]* 30.1 Write property test for non-admin access denial
  - **Property 81: Non-admin access denial**
  - **Validates: Requirements 21.3**

- [ ]* 30.2 Write property test for admin route protection
  - **Property 82: Admin route protection**
  - **Validates: Requirements 21.5**

- [ ] 31. Implement admin dashboard: System statistics
  - Display user metrics (total, active, new)
  - Display merchant metrics (total, trusted, flagged)
  - Display submission metrics (24h count, hourly average)
  - Display alert metrics (total active, 24h triggered)
  - Display current aggregated prices for all assets
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ] 32. Implement admin dashboard: User management
  - Create users page with paginated list
  - Implement user search by username/Telegram ID
  - Display user detail view with activity history
  - Implement plan update functionality
  - Implement account deactivation
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

- [ ] 33. Implement admin dashboard: Merchant management
  - Create merchants page with paginated list
  - Display merchant statistics (reputation, submissions, accuracy)
  - Implement manual trusted status control
  - Implement merchant flagging/unflagging
  - Log all admin actions
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ] 34. Implement admin dashboard: Submission audit
  - Create submissions page with paginated list
  - Implement filtering by asset type and validation status
  - Display submission detail view
  - Implement manual submission invalidation
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

- [ ] 35. Implement admin dashboard: System logs
  - Create logs page with paginated list
  - Implement filtering by level, date, keyword
  - Display log entries with timestamp and context
  - Implement 30-day retention policy
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_

- [ ] 36. Implement admin commands in bot
  - Create /admin command (role check)
  - Implement manual price recalculation trigger
  - Implement manual report sending
  - Implement cache clearing
  - Implement test alert trigger
  - Log all admin operations
  - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 28.3_

- [ ]* 36.1 Write property test for admin role requirement
  - **Property 85: Admin role requirement for admin commands**
  - **Validates: Requirements 28.3**

- [ ] 37. Implement comprehensive error handling
  - Implement global error handler with logging
  - Implement specific error messages for validation failures
  - Implement database timeout retry logic (retry once)
  - Implement API failure graceful degradation (use cache)
  - Add help buttons to all error messages
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ]* 37.1 Write property test for unhandled error recovery
  - **Property 66: Unhandled error recovery**
  - **Validates: Requirements 18.1**

- [ ]* 37.2 Write property test for validation error specificity
  - **Property 67: Validation error specificity**
  - **Validates: Requirements 18.2**

- [ ]* 37.3 Write property test for database timeout retry
  - **Property 68: Database timeout retry**
  - **Validates: Requirements 18.3**

- [ ]* 37.4 Write property test for API failure graceful degradation
  - **Property 69: API failure graceful degradation**
  - **Validates: Requirements 18.4**

- [ ] 38. Implement database transactions for multi-record operations
  - Wrap alert creation with related records in transactions
  - Wrap merchant reputation updates in transactions
  - Wrap user plan upgrades in transactions
  - _Requirements: 16.5_

- [ ]* 38.1 Write property test for transaction atomicity
  - **Property 65: Transaction atomicity**
  - **Validates: Requirements 16.5**

- [ ] 39. Set up logging with Winston
  - Configure Winston logger with JSON format
  - Implement log levels (INFO, WARNING, ERROR)
  - Log all errors with stack traces
  - Log all admin actions
  - Log all API failures
  - Store logs in database (SystemLog model)
  - _Requirements: 18.1, 18.4_

- [ ]* 39.1 Write property test for database error logging
  - **Property 64: Database error logging**
  - **Validates: Requirements 16.4**

- [ ] 40. Configure deployment for Render
  - Create render.yaml with web service configuration
  - Configure Neon Postgres database connection
  - Set up cron jobs for background tasks (price fetcher, calculator, alert monitor, report generator)
  - Configure environment variables
  - Set up health check endpoint monitoring
  - _Requirements: 17.1, 17.3, 17.4_

- [ ] 41. Create comprehensive README documentation
  - Document project setup and installation
  - Document environment variables
  - Document database migrations
  - Document deployment process
  - Document API endpoints
  - Document bot commands
  - _Requirements: 33.4_

- [ ] 42. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Fix any failing tests
  - Verify all correctness properties are validated
  - Ask the user if questions arise
