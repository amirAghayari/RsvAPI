# Ticket Express Technical Documentation

## System Architecture

Ticket Express is a modular REST API backend built with Node.js and TypeScript. It uses a layered architecture with the following explicit boundaries:

- **Server bootstrap:** `src/server.ts` initializes the Express app, database, and Redis.
- **Configuration layer:** `src/app/config.ts` applies security, parsing, logging, and rate limiting.
- **Router layer:** `src/app/routes.ts` wires HTTP endpoints to feature routers.
- **Controller layer:** `src/core/*/controllers/*` handles request coordination and response formatting.
- **Service layer:** `src/core/*/services/*` contains business rules and transactions.
- **Repository layer:** `src/core/*/repository/*` encapsulates TypeORM database access.
- **Integration layer:** `src/core/integrations/*` connects to external services like Zarinpal.
- **Error layer:** `src/middlewares/error-handler.ts` and custom `AppError` classes normalize failures.

The codebase follows a controller-service-repository pattern with strong separation between HTTP, domain logic, and persistence.

## Data Flow

1. **Request arrival:** Client requests arrive at Express routes under `/api/V1/*` or `/docs`.
2. **Middleware chain:** Requests pass through global middleware (security headers, CORS, body parsing, cookies, rate limiting, logger, validation, auth).
3. **Route dispatch:** Route handlers call the appropriate controller for the feature module.
4. **Service layer:** Controllers delegate business logic to service classes located in `src/core/*/services`.
5. **Repository layer:** Services interact with the database through repository classes in `src/core/*/repository`.
6. **Database access:** TypeORM persists and queries PostgreSQL entities defined in `src/core/*/*.entity.ts`.
7. **External integration:** Some flows call Cloudinary, Zarinpal, Redis, or email services.
8. **Response:** Result objects are sent back to clients in JSON format, using standardized error handling when failures occur.

## Core Modules

### `src/server.ts`
- Starts the HTTP server.
- Initializes the database and Redis client.
- Handles `unhandledRejection` and graceful shutdown.

### `src/app/index.ts`
- Configures global process event handling for uncaught exceptions and SIGINT.
- Loads Express middleware and route modules.

### `src/app/config.ts`
- Applies security middleware: Helmet, CORS, HPP.
- Enables request logging via Morgan and Pino.
- Configures JSON and URL-encoded payload size limits.
- Applies rate limiting in production.

### `src/app/routes.ts`
- Registers Swagger UI at `/docs`.
- Mounts routers for users, events, reservations, tickets, and payments.
- Handles unknown routes with `NotFoundError`.
- Applies centralized error handling.

### `src/config/dataSource.ts`
- Creates TypeORM `DataSource` with PostgreSQL.
- Supports separate test and Docker database configuration.
- Loads entities and migration paths.

### `src/config/redisClient.ts`
- Creates and manages Redis connections.
- Handles reconnect logic and readiness checks.
- Used by rate limit stores and cache middleware.

### `src/config/cloudinary.ts`
- Configures Cloudinary client from environment variables.
- Used for avatar and image upload operations.

### `src/config/zarinpal.ts`
- Configures Zarinpal payment gateway settings.
- Used by payment flow to validate callbacks.

### Feature modules under `src/core`
- `users` — authentication, profile, admin user management.
- `events` — event creation, retrieval, update, deletion.
- `tickets` — event ticket management.
- `reservations` — reservation lifecycle, status tracking, user and admin operations.
- `payments` — payment creation, verification, user/admin access.
- `integrations` — external payment gateway service.

### `src/middlewares`
- `auth.middleware.ts` — enforces authentication via JWT.
- `admin.middleware.ts` — authorizes admin-only routes.
- `validate.middleware.ts` — validates requests using Zod schemas.
- `rateLimit.middleware.ts` — protects endpoints with Redis-backed rate limiting.
- `error-handler.ts` — standardizes error responses.
- `upload.middleware.ts` — handles multipart file uploads.

### `src/utils`
- `AppError.ts` — base application error class.
- `jwt.ts` — JWT signing and verification utilities.
- `createSendTokenAndResponse.ts` — sends auth cookies and tokens.
- `email.ts` — SMTP email delivery for password reset flows.
- `apiFeatures.ts` — utility for filtering/pagination (if used by endpoints).

## Error Handling

- Application errors inherit from `AppError` and provide structured responses.
- The `errorHandler` middleware returns:
  - `statusCode` and serialized error details for known application errors.
  - `500` with a generic message for unexpected failures.
- Authentication failures throw `NotAuthorizedError`.
- Unknown routes throw `NotFoundError`.
- `server.ts` exits on unhandled promise rejections.
- `app/index.ts` exits on uncaught exceptions and cleans up Redis on SIGINT.

## Environment Variables

The application uses environment variables to drive runtime configuration.

### Server & runtime
- `NODE_ENV` — application environment: `development`, `production`, `test`, `deployment`.
- `IS_DOCKER` — whether the app is running inside Docker.
- `PORT` — HTTP port.
- `FRONTEND_URL` — frontend host used to build password reset links.
- `LOG_LEVEL` — logging verbosity.

### Database
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USERNAME`, `TEST_DB_PASSWORD`, `TEST_DB_NAME`

### Redis
- `REDIS_URL` — Redis URL for caching and rate limiting.
- `TEST_REDIS_URL` — Redis URL used during tests.

### Authentication
- `JWT_SECRET` — shared JWT secret (legacy/utility flows).
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — token signing secrets.
- `JWT_COOKIE_EXPIRES_IN`, `JWT_REFRESH_COOKIE_EXPIRES_IN`
- `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`
- `BYCRYPT_SALT_ROUNDS` — bcrypt password hashing strength.
- `PASSWORD_RESET_EXPIRES_IN` — reset link expiration.

### Cloudinary
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Email
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`

### Payment Integration
- `ZARINPAL_SANDBOX`
- `ZARINPAL_MERCHANT_ID`
- `ZARINPAL_CALLBACK_URL`

> Note: `.env` must remain private and is intentionally excluded from version control.

## Deployment Guide

### Local development
1. Copy `.env.example` to `.env`.
2. Update values for PostgreSQL, Redis, JWT secrets, email, Cloudinary, and Zarinpal.
3. Install dependencies:
   - `npm ci`
4. Start in development mode:
   - `npm run dev`

### Build for production
1. Compile TypeScript:
   - `npm run build`
2. Start production server:
   - `npm start`

### Docker
1. Create or update `.env` with Docker-aware variables.
2. Launch containers:
   - `docker compose up -d --build`
3. The app is available on port `3000` by default.

### Database migrations
- Generate a new migration:
  - `npm run migrate:generate`
- Run migrations:
  - `npm run migrate:run`
- Revert migrations:
  - `npm run migrate:revert`

### Notes
- Swagger docs are served at `/docs`.
- The application uses PostgreSQL, Redis, Cloudinary, and Zarinpal integration.
- Ensure the `.env` file is not committed. `.gitignore` includes `.env` and env variants.
