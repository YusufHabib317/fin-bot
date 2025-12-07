# Requirements Document

## Introduction

Market Pulse is a real-time financial alert system delivered through a Telegram bot using GrammyJS and TypeScript. The system aggregates market prices (USD, gold, cryptocurrency) from multiple sources including merchants, public APIs, and user contributions. It applies statistical filtering and reputation scoring to ensure data accuracy, then sends intelligent price alerts to users. The bot targets markets with high volatility and unofficial pricing (Syria, Lebanon, Egypt) where trustworthy real-time price information is critical. The system uses Neon Postgres with Prisma ORM, deploys on Render, and supports English and Arabic localization.

## Glossary

- **Market Pulse Bot**: The Telegram bot system that aggregates and delivers financial alerts
- **Price Source**: Any entity that submits price data (merchant, API, user, web scraper)
- **Merchant**: A verified business entity that regularly submits market prices
- **Trusted Merchant**: A merchant with high reputation score based on historical accuracy
- **Price Submission**: A single price data point submitted by a price source
- **Deviation Check**: Statistical validation that compares submitted price against recent average
- **Reputation Score**: Numerical rating (0-100) reflecting a merchant's historical accuracy
- **Alert**: A notification sent to users when specific price conditions are met
- **Threshold Alert**: Notification triggered when price crosses a specific value
- **Movement Alert**: Notification triggered when price changes by a percentage within a time window
- **Zone Alert**: Notification triggered when price enters a defined range
- **Trend Alert**: Notification triggered by detected market patterns (uptrend, downtrend, volatility, reversal)
- **Aggregated Market Price**: The calculated real price after filtering and validation
- **Free Plan User**: User with limited alerts and delayed notifications
- **Pro Plan User**: Subscriber with unlimited real-time alerts and advanced features
- **Merchant Pro User**: Merchant subscriber with verified badge and enhanced visibility
- **User Dashboard**: Interface where users manage alerts and view settings
- **Daily Report**: Summary of market activity including high, low, trend, and volatility
- **Localization**: Multi-language support (English and Arabic)
- **Neon Postgres**: Cloud-native serverless Postgres database
- **Prisma**: TypeScript ORM for database access
- **GrammyJS**: TypeScript framework for building Telegram bots
- **Render**: Cloud platform for deployment
- **Better Auth**: Authentication and authorization library for secure user management
- **Admin Dashboard**: Web interface for administrators to monitor and manage the system
- **Session**: Authenticated user session managed by Better Auth
- **Role**: User permission level (user, merchant, administrator)
- **Yarn**: Package manager for dependency management
- **Grammy Plugin**: Extension module for Grammy framework (conversations, menu, inline keyboard, etc.)
- **Inline Keyboard**: Interactive button interface within Telegram messages
- **Conversation**: Grammy plugin for managing multi-step user interactions
- **Menu**: Grammy plugin for creating dynamic navigation menus

## Requirements

### Requirement 1

**User Story:** As a user, I want to receive the bot in my preferred language (English or Arabic), so that I can interact with it comfortably.

#### Acceptance Criteria

1. WHEN a user starts the bot for the first time, THE Market Pulse Bot SHALL display a language selection menu using Grammy inline keyboard with English and Arabic options
2. WHEN a user selects a language, THE Market Pulse Bot SHALL store the language preference in the user profile
3. WHEN the bot sends any message to a user, THE Market Pulse Bot SHALL use the stored language preference for all text content
4. WHEN a user changes their language preference, THE Market Pulse Bot SHALL update all subsequent messages to use the new language
5. THE Market Pulse Bot SHALL support complete localization of all user-facing text including menus, alerts, reports, and error messages using Grammy i18n plugin

### Requirement 2

**User Story:** As a merchant, I want to submit market prices to the bot, so that I can contribute to the aggregated market data.

#### Acceptance Criteria

1. WHEN a merchant submits a price with asset type and value, THE Market Pulse Bot SHALL validate the submission format
2. WHEN a price submission passes format validation, THE Market Pulse Bot SHALL store the submission with timestamp and merchant identifier
3. WHEN a price submission deviates more than 10% from the recent average, THE Market Pulse Bot SHALL flag the submission as suspicious
4. WHEN a suspicious price is flagged, THE Market Pulse Bot SHALL exclude it from aggregated market price calculations
5. WHEN a merchant submits a price, THE Market Pulse Bot SHALL confirm receipt with submission status

### Requirement 3

**User Story:** As the system, I want to collect prices from public APIs, so that I can supplement merchant-submitted data with external sources.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL fetch cryptocurrency prices from at least one public API every 60 seconds
2. THE Market Pulse Bot SHALL fetch gold prices from at least one public API every 300 seconds
3. THE Market Pulse Bot SHALL fetch forex rates from at least one public API every 60 seconds
4. WHEN an API request fails, THE Market Pulse Bot SHALL log the error and retry after the next scheduled interval
5. WHEN API data is received, THE Market Pulse Bot SHALL store it with source identifier and timestamp

### Requirement 4

**User Story:** As the system, I want to calculate reputation scores for merchants, so that I can identify trustworthy price sources.

#### Acceptance Criteria

1. WHEN a merchant submits a price that falls within 5% of the final aggregated price, THE Market Pulse Bot SHALL increment the merchant's accuracy count
2. WHEN a merchant submits a price that deviates more than 10% from the final aggregated price, THE Market Pulse Bot SHALL decrement the merchant's reputation score
3. THE Market Pulse Bot SHALL calculate reputation score as (accurate_submissions / total_submissions) × 100
4. WHEN a merchant's reputation score exceeds 85, THE Market Pulse Bot SHALL grant trusted merchant status
5. WHEN a merchant's reputation score falls below 70, THE Market Pulse Bot SHALL revoke trusted merchant status

### Requirement 5

**User Story:** As the system, I want to calculate an aggregated market price, so that users receive accurate filtered price information.

#### Acceptance Criteria

1. WHEN calculating aggregated market price, THE Market Pulse Bot SHALL include only submissions from the last 600 seconds
2. WHEN calculating aggregated market price, THE Market Pulse Bot SHALL exclude submissions flagged as suspicious
3. THE Market Pulse Bot SHALL calculate aggregated market price as the weighted average where trusted merchant submissions have weight 2.0 and regular submissions have weight 1.0
4. WHEN fewer than 3 valid submissions exist, THE Market Pulse Bot SHALL mark the aggregated price as low confidence
5. THE Market Pulse Bot SHALL recalculate aggregated market price every 30 seconds

### Requirement 6

**User Story:** As a user, I want to create threshold alerts, so that I am notified when prices cross specific values.

#### Acceptance Criteria

1. WHEN a user creates a threshold alert with asset type, threshold value, and direction (above/below), THE Market Pulse Bot SHALL validate the parameters
2. WHEN threshold alert parameters are valid, THE Market Pulse Bot SHALL store the alert with user identifier and active status
3. WHEN the aggregated market price crosses the threshold in the specified direction, THE Market Pulse Bot SHALL send a notification to the user
4. WHEN a threshold alert is triggered, THE Market Pulse Bot SHALL include current price, threshold value, and timestamp in the notification
5. WHERE a user has a Free Plan, THE Market Pulse Bot SHALL limit the user to 3 active threshold alerts

### Requirement 7

**User Story:** As a user, I want to create movement alerts, so that I am notified when prices change significantly within a time window.

#### Acceptance Criteria

1. WHEN a user creates a movement alert with asset type, percentage threshold, and time window, THE Market Pulse Bot SHALL validate the parameters
2. WHEN movement alert parameters are valid, THE Market Pulse Bot SHALL store the alert with user identifier and active status
3. WHEN the price changes by the specified percentage within the time window, THE Market Pulse Bot SHALL send a notification to the user
4. WHEN a movement alert is triggered, THE Market Pulse Bot SHALL include percentage change, time window, and current price in the notification
5. WHERE a user has a Free Plan, THE Market Pulse Bot SHALL not allow creation of movement alerts

### Requirement 8

**User Story:** As a user, I want to create zone alerts, so that I am notified when prices enter specific ranges.

#### Acceptance Criteria

1. WHEN a user creates a zone alert with asset type, minimum value, and maximum value, THE Market Pulse Bot SHALL validate that minimum is less than maximum
2. WHEN zone alert parameters are valid, THE Market Pulse Bot SHALL store the alert with user identifier and active status
3. WHEN the aggregated market price enters the specified range from outside, THE Market Pulse Bot SHALL send a notification to the user
4. WHEN a zone alert is triggered, THE Market Pulse Bot SHALL include current price, zone boundaries, and entry direction in the notification
5. WHERE a user has a Free Plan, THE Market Pulse Bot SHALL not allow creation of zone alerts

### Requirement 9

**User Story:** As a user, I want to receive trend alerts, so that I am notified of significant market pattern changes.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL detect uptrend when price increases for 3 consecutive calculation intervals with total increase exceeding 2%
2. THE Market Pulse Bot SHALL detect downtrend when price decreases for 3 consecutive calculation intervals with total decrease exceeding 2%
3. THE Market Pulse Bot SHALL detect high volatility when standard deviation of last 10 prices exceeds 3% of mean price
4. THE Market Pulse Bot SHALL detect market reversal when trend direction changes after at least 5 consecutive intervals in one direction
5. WHEN a trend pattern is detected, THE Market Pulse Bot SHALL send notifications to all users subscribed to trend alerts for that asset

### Requirement 10

**User Story:** As a user, I want to receive a daily report, so that I can review market activity summary.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL generate a daily report at 20:00 local time for each subscribed user
2. WHEN generating a daily report, THE Market Pulse Bot SHALL include highest price, lowest price, opening price, and closing price for each tracked asset
3. WHEN generating a daily report, THE Market Pulse Bot SHALL calculate and include the overall trend (uptrend, downtrend, or stable)
4. WHEN generating a daily report, THE Market Pulse Bot SHALL calculate and include volatility percentage
5. WHERE a user has a Free Plan, THE Market Pulse Bot SHALL not send daily reports

### Requirement 11

**User Story:** As a user, I want to view the current aggregated market price, so that I can check prices on demand.

#### Acceptance Criteria

1. WHEN a user requests current price for an asset, THE Market Pulse Bot SHALL retrieve the most recent aggregated market price
2. WHEN displaying aggregated market price, THE Market Pulse Bot SHALL include the price value, trend indicator (↑↓→), and last update timestamp
3. WHEN displaying aggregated market price, THE Market Pulse Bot SHALL include the number of trusted merchants contributing to the price
4. WHEN displaying aggregated market price, THE Market Pulse Bot SHALL include the high and low prices from the last 24 hours
5. WHEN displaying aggregated market price, THE Market Pulse Bot SHALL include the price spread (difference between highest and lowest current submissions)

### Requirement 12

**User Story:** As a user, I want to manage my alerts through a dashboard, so that I can view, edit, and delete my active alerts.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard, THE Market Pulse Bot SHALL display all active alerts with alert type, asset, and parameters
2. WHEN a user selects an alert from the dashboard, THE Market Pulse Bot SHALL provide options to edit, delete, or toggle active status
3. WHEN a user deletes an alert, THE Market Pulse Bot SHALL remove the alert from the database and confirm deletion
4. WHEN a user edits an alert, THE Market Pulse Bot SHALL validate new parameters before updating
5. WHEN a user toggles alert status, THE Market Pulse Bot SHALL update the active flag and confirm the change

### Requirement 13

**User Story:** As a user, I want to upgrade to Pro Plan, so that I can access unlimited alerts and real-time notifications.

#### Acceptance Criteria

1. WHEN a user requests plan information, THE Market Pulse Bot SHALL display Free Plan and Pro Plan features with pricing
2. WHEN a user initiates Pro Plan upgrade, THE Market Pulse Bot SHALL provide payment instructions and subscription options
3. WHEN a user completes payment verification, THE Market Pulse Bot SHALL update the user's plan status to Pro Plan
4. WHERE a user has a Pro Plan, THE Market Pulse Bot SHALL remove all alert quantity limits
5. WHERE a user has a Pro Plan, THE Market Pulse Bot SHALL send notifications immediately without delay

### Requirement 14

**User Story:** As a merchant, I want to upgrade to Merchant Pro, so that I can receive a verified badge and enhanced visibility.

#### Acceptance Criteria

1. WHEN a merchant requests Merchant Pro information, THE Market Pulse Bot SHALL display Merchant Pro features with pricing
2. WHEN a merchant completes Merchant Pro subscription, THE Market Pulse Bot SHALL add a verified badge to the merchant profile
3. WHERE a merchant has Merchant Pro status, THE Market Pulse Bot SHALL list the merchant in the trusted sources directory
4. WHERE a merchant has Merchant Pro status, THE Market Pulse Bot SHALL allow unlimited price submissions without rate limiting
5. WHERE a merchant has Merchant Pro status, THE Market Pulse Bot SHALL provide analytics including average deviation and accuracy percentage

### Requirement 15

**User Story:** As a user, I want to vote on submitted prices, so that I can help validate community-submitted data.

#### Acceptance Criteria

1. WHEN a user views a recent price submission, THE Market Pulse Bot SHALL display voting options (👍 upvote / 👎 downvote)
2. WHEN a user casts a vote on a price submission, THE Market Pulse Bot SHALL record the vote with user identifier and timestamp
3. WHEN a price submission receives more than 5 downvotes, THE Market Pulse Bot SHALL flag the submission as suspicious
4. WHEN a price submission receives more than 10 upvotes, THE Market Pulse Bot SHALL increase the weight of that submission by 1.5x
5. THE Market Pulse Bot SHALL prevent a user from voting multiple times on the same price submission

### Requirement 16

**User Story:** As the system, I want to persist all data in Neon Postgres using Prisma, so that data is reliably stored and queryable.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL use Prisma ORM for all database operations
2. THE Market Pulse Bot SHALL connect to Neon Postgres using connection string from environment variables
3. WHEN the bot starts, THE Market Pulse Bot SHALL verify database connectivity before accepting user requests
4. WHEN a database operation fails, THE Market Pulse Bot SHALL log the error with full context and return a user-friendly error message
5. THE Market Pulse Bot SHALL use database transactions for operations that modify multiple related records

### Requirement 17

**User Story:** As a developer, I want the bot to run on Render with ExpressJS, so that it is deployed reliably with health monitoring.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL expose an HTTP health check endpoint at /health that returns status 200
2. THE Market Pulse Bot SHALL initialize ExpressJS server before starting the Telegram bot webhook
3. WHEN deployed on Render, THE Market Pulse Bot SHALL use webhook mode instead of polling for Telegram updates
4. THE Market Pulse Bot SHALL read all configuration from environment variables including bot token, database URL, and webhook URL
5. WHEN the server receives SIGTERM signal, THE Market Pulse Bot SHALL gracefully shutdown by closing database connections and stopping the bot

### Requirement 18

**User Story:** As the system, I want to handle errors gracefully, so that users receive helpful feedback and the system remains stable.

#### Acceptance Criteria

1. WHEN an unhandled error occurs during message processing, THE Market Pulse Bot SHALL log the error with stack trace and send a generic error message to the user
2. WHEN a user provides invalid input, THE Market Pulse Bot SHALL respond with a specific error message explaining the validation failure
3. WHEN a database query times out, THE Market Pulse Bot SHALL retry once before returning an error to the user
4. WHEN an external API is unavailable, THE Market Pulse Bot SHALL continue operating with cached data and log the API failure
5. THE Market Pulse Bot SHALL implement rate limiting to prevent abuse with maximum 30 requests per user per minute

### Requirement 19

**User Story:** As a user, I want to search for trusted merchants, so that I can see which sources contribute to price data.

#### Acceptance Criteria

1. WHEN a user requests the trusted merchants list, THE Market Pulse Bot SHALL retrieve all merchants with trusted status
2. WHEN displaying trusted merchants, THE Market Pulse Bot SHALL include merchant name, reputation score, and total submissions count
3. WHEN displaying trusted merchants, THE Market Pulse Bot SHALL sort by reputation score in descending order
4. WHERE a merchant has Merchant Pro status, THE Market Pulse Bot SHALL display a verified badge next to the merchant name
5. WHEN a user selects a merchant from the list, THE Market Pulse Bot SHALL display detailed statistics including accuracy rate and submission history

### Requirement 20

**User Story:** As a user, I want to authenticate securely with the bot, so that my data and preferences are protected.

#### Acceptance Criteria

1. WHEN a user starts the bot for the first time, THE Market Pulse Bot SHALL create a user account using Better Auth with Telegram user identifier
2. WHEN a user interacts with the bot, THE Market Pulse Bot SHALL validate the session using Better Auth before processing requests
3. THE Market Pulse Bot SHALL store user sessions with expiration time of 30 days
4. WHEN a session expires, THE Market Pulse Bot SHALL prompt the user to restart the bot to create a new session
5. THE Market Pulse Bot SHALL use Better Auth to manage user roles (user, merchant, administrator)

### Requirement 21

**User Story:** As an administrator, I want to access a web dashboard, so that I can monitor system health and user activity.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL provide a web-based admin dashboard accessible at /admin path
2. WHEN an administrator accesses the admin dashboard, THE Market Pulse Bot SHALL authenticate the user using Better Auth
3. WHERE a user does not have administrator role, WHEN the user attempts to access the admin dashboard, THE Market Pulse Bot SHALL return HTTP 403 Forbidden
4. WHEN an administrator successfully authenticates, THE Market Pulse Bot SHALL display the admin dashboard interface
5. THE Market Pulse Bot SHALL protect all admin dashboard routes with Better Auth middleware requiring administrator role

### Requirement 22

**User Story:** As an administrator, I want to view system statistics on the dashboard, so that I can monitor overall platform health.

#### Acceptance Criteria

1. WHEN an administrator views the dashboard home page, THE Market Pulse Bot SHALL display total user count, active user count (last 7 days), and new user count (last 24 hours)
2. WHEN an administrator views the dashboard home page, THE Market Pulse Bot SHALL display total merchant count, trusted merchant count, and flagged merchant count
3. WHEN an administrator views the dashboard home page, THE Market Pulse Bot SHALL display total price submissions in last 24 hours and average submissions per hour
4. WHEN an administrator views the dashboard home page, THE Market Pulse Bot SHALL display total active alerts and alerts triggered in last 24 hours
5. WHEN an administrator views the dashboard home page, THE Market Pulse Bot SHALL display current aggregated prices for all tracked assets with last update timestamp

### Requirement 23

**User Story:** As an administrator, I want to view and manage all users, so that I can moderate accounts and resolve issues.

#### Acceptance Criteria

1. WHEN an administrator accesses the users page, THE Market Pulse Bot SHALL display a paginated list of all users with username, plan type, registration date, and last active date
2. WHEN an administrator searches for a user by username or Telegram ID, THE Market Pulse Bot SHALL filter the user list to matching results
3. WHEN an administrator selects a user, THE Market Pulse Bot SHALL display detailed user information including active alerts, subscription status, and activity history
4. WHEN an administrator updates a user's plan type, THE Market Pulse Bot SHALL validate the new plan and update the user record
5. WHEN an administrator deactivates a user account, THE Market Pulse Bot SHALL set the user status to inactive and prevent bot access for that user

### Requirement 24

**User Story:** As an administrator, I want to view and manage all merchants, so that I can ensure data quality.

#### Acceptance Criteria

1. WHEN an administrator accesses the merchants page, THE Market Pulse Bot SHALL display a paginated list of all merchants with name, reputation score, trusted status, and submission count
2. WHEN an administrator selects a merchant, THE Market Pulse Bot SHALL display detailed merchant statistics including accuracy rate, flagged status, and recent submissions
3. WHEN an administrator manually sets trusted status for a merchant, THE Market Pulse Bot SHALL update the merchant record and log the action
4. WHEN an administrator flags a merchant, THE Market Pulse Bot SHALL set flagged status to true and exclude future submissions from aggregated calculations
5. WHEN an administrator unflags a merchant, THE Market Pulse Bot SHALL set flagged status to false and include future submissions in aggregated calculations

### Requirement 25

**User Story:** As an administrator, I want to view price submission history, so that I can audit data quality and detect anomalies.

#### Acceptance Criteria

1. WHEN an administrator accesses the submissions page, THE Market Pulse Bot SHALL display recent price submissions with asset type, value, merchant name, timestamp, and validation status
2. WHEN an administrator filters submissions by asset type, THE Market Pulse Bot SHALL display only submissions matching the selected asset
3. WHEN an administrator filters submissions by validation status (valid, suspicious, flagged), THE Market Pulse Bot SHALL display only submissions matching the selected status
4. WHEN an administrator selects a submission, THE Market Pulse Bot SHALL display detailed information including deviation percentage, votes, and merchant reputation at time of submission
5. WHEN an administrator manually marks a submission as invalid, THE Market Pulse Bot SHALL exclude it from all calculations and update the merchant's reputation score

### Requirement 26

**User Story:** As an administrator, I want to view system logs, so that I can troubleshoot errors and monitor bot activity.

#### Acceptance Criteria

1. WHEN an administrator accesses the logs page, THE Market Pulse Bot SHALL display recent log entries with timestamp, level (info, warning, error), and message
2. WHEN an administrator filters logs by level, THE Market Pulse Bot SHALL display only log entries matching the selected level
3. WHEN an administrator filters logs by date range, THE Market Pulse Bot SHALL display only log entries within the specified range
4. WHEN an administrator searches logs by keyword, THE Market Pulse Bot SHALL display log entries containing the search term
5. THE Market Pulse Bot SHALL retain log entries for 30 days before automatic deletion

### Requirement 27

**User Story:** As an administrator, I want to manually trigger system operations, so that I can test functionality and resolve issues.

#### Acceptance Criteria

1. WHERE a user has administrator role, WHEN the administrator issues a recalculate command for an asset, THE Market Pulse Bot SHALL immediately recalculate the aggregated market price
2. WHERE a user has administrator role, WHEN the administrator issues a send-report command for a user, THE Market Pulse Bot SHALL immediately generate and send a daily report to that user
3. WHERE a user has administrator role, WHEN the administrator issues a clear-cache command, THE Market Pulse Bot SHALL clear all cached data and reload from database
4. WHERE a user has administrator role, WHEN the administrator issues a test-alert command with alert parameters, THE Market Pulse Bot SHALL trigger a test notification
5. WHEN an administrator triggers a manual operation, THE Market Pulse Bot SHALL log the action with administrator identifier and timestamp

### Requirement 28

**User Story:** As the system, I want to enforce role-based access control, so that users can only perform authorized actions.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL assign the user role to all new accounts by default
2. WHEN a user attempts to submit a price without merchant role, THE Market Pulse Bot SHALL reject the request with an authorization error
3. WHEN a user attempts to access admin commands without administrator role, THE Market Pulse Bot SHALL reject the request with an authorization error
4. THE Market Pulse Bot SHALL use Better Auth to verify user roles before processing any role-restricted operation
5. WHEN an administrator changes a user's role, THE Market Pulse Bot SHALL update the role in Better Auth and apply changes immediately

### Requirement 29

**User Story:** As a user, I want to interact with the bot through modern inline keyboards and menus, so that I have an intuitive and efficient experience.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL use Grammy Menu plugin to create all navigation menus with dynamic button layouts
2. WHEN a user accesses the main menu, THE Market Pulse Bot SHALL display inline keyboard buttons for primary actions (View Prices, Manage Alerts, Settings, Help)
3. WHEN a user selects a menu option, THE Market Pulse Bot SHALL update the message inline without sending new messages
4. THE Market Pulse Bot SHALL use emoji icons in all inline keyboard buttons to improve visual clarity
5. WHEN displaying lists with pagination, THE Market Pulse Bot SHALL include Previous and Next buttons using inline keyboard

### Requirement 30

**User Story:** As a user, I want to create alerts through guided conversations, so that I can easily configure complex alert parameters.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL use Grammy Conversations plugin for all multi-step alert creation flows
2. WHEN a user initiates alert creation, THE Market Pulse Bot SHALL start a conversation that guides the user through parameter selection
3. WHEN a user is in a conversation, THE Market Pulse Bot SHALL display progress indicators showing current step and total steps
4. WHEN a user provides invalid input during a conversation, THE Market Pulse Bot SHALL display an error message and prompt for correct input without restarting
5. WHEN a user completes a conversation, THE Market Pulse Bot SHALL display a summary of configured parameters with confirmation buttons

### Requirement 31

**User Story:** As a user, I want to receive visually appealing formatted messages, so that information is easy to read and understand.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL use Telegram MarkdownV2 or HTML formatting for all messages with structured data
2. WHEN displaying prices, THE Market Pulse Bot SHALL use monospace font for numerical values and bold text for labels
3. WHEN displaying alerts or reports, THE Market Pulse Bot SHALL use emoji indicators for status (✅ active, ⏸️ paused, 🔔 triggered)
4. WHEN displaying trend information, THE Market Pulse Bot SHALL use directional emoji (📈 uptrend, 📉 downtrend, ➡️ stable)
5. THE Market Pulse Bot SHALL structure long messages with clear sections using line breaks and separators

### Requirement 32

**User Story:** As a user, I want to receive interactive price displays with quick actions, so that I can efficiently manage my monitoring.

#### Acceptance Criteria

1. WHEN a user views current price, THE Market Pulse Bot SHALL include inline keyboard buttons for quick actions (Set Alert, View History, Refresh)
2. WHEN a user clicks Refresh button, THE Market Pulse Bot SHALL update the price display inline without sending a new message
3. WHEN a user clicks Set Alert button, THE Market Pulse Bot SHALL start an alert creation conversation pre-filled with the current asset
4. THE Market Pulse Bot SHALL use Grammy inline query handlers to enable price lookups from any chat
5. WHEN displaying multiple assets, THE Market Pulse Bot SHALL use inline keyboard with asset buttons for quick switching

### Requirement 33

**User Story:** As a developer, I want to use Yarn for package management, so that dependency installation is fast and reliable.

#### Acceptance Criteria

1. THE Market Pulse Bot project SHALL include a yarn.lock file for dependency version locking
2. THE Market Pulse Bot project SHALL include package.json scripts for common operations (dev, build, start, migrate)
3. THE Market Pulse Bot SHALL use Yarn workspaces if the project includes multiple packages
4. THE Market Pulse Bot documentation SHALL specify Yarn as the required package manager with minimum version 1.22.0
5. THE Market Pulse Bot CI/CD configuration SHALL use Yarn for dependency installation and build processes

### Requirement 34

**User Story:** As a user, I want to use command shortcuts, so that I can quickly access common features.

#### Acceptance Criteria

1. THE Market Pulse Bot SHALL register Telegram bot commands for primary actions (/start, /help, /price, /alerts, /settings)
2. WHEN a user types a command, THE Market Pulse Bot SHALL display the command in Telegram's command menu with description
3. THE Market Pulse Bot SHALL support command parameters for quick operations (e.g., /price usd, /alert create)
4. WHEN a user sends an unrecognized command, THE Market Pulse Bot SHALL suggest similar valid commands
5. THE Market Pulse Bot SHALL use Grammy command handlers with middleware for authentication and rate limiting

### Requirement 35

**User Story:** As a user, I want to receive loading indicators during operations, so that I know the bot is processing my request.

#### Acceptance Criteria

1. WHEN a user initiates an operation that takes longer than 1 second, THE Market Pulse Bot SHALL send a chat action indicator (typing, uploading)
2. WHEN fetching data from external APIs, THE Market Pulse Bot SHALL display a temporary message with loading emoji (⏳ Processing...)
3. WHEN an operation completes, THE Market Pulse Bot SHALL update or remove the loading indicator
4. THE Market Pulse Bot SHALL use Grammy chat action middleware to automatically manage typing indicators
5. WHEN an operation fails, THE Market Pulse Bot SHALL replace the loading indicator with an error message

### Requirement 36

**User Story:** As a user, I want to receive contextual help, so that I can learn how to use features without leaving the conversation.

#### Acceptance Criteria

1. WHEN a user sends /help command, THE Market Pulse Bot SHALL display a main help menu with categories using inline keyboard
2. WHEN a user selects a help category, THE Market Pulse Bot SHALL display detailed information with examples and inline keyboard to return to menu
3. WHEN a user encounters an error, THE Market Pulse Bot SHALL include a help button in the error message linking to relevant documentation
4. THE Market Pulse Bot SHALL provide inline help hints during conversations using Grammy conversation plugin
5. WHEN a user is idle in a conversation for 60 seconds, THE Market Pulse Bot SHALL send a helpful prompt with suggested next actions
