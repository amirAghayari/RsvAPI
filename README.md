# Ticket Express

**Ticket Express** is a RESTful event ticketing backend built with Node.js, TypeScript, Express, and PostgreSQL.

![CI](https://img.shields.io/badge/ci-pending-lightgrey)
![Coverage](https://img.shields.io/badge/coverage-pending-lightgrey)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

## Features

- User authentication and authorization with JWT
- Role-based access controls for users and admins
- Event creation, update, deletion, and listing
- Ticket management for events
- Reservation lifecycle management
- Payment creation and verification via Zarinpal integration
- File upload support for user avatars via Cloudinary
- API validation, security middleware, caching, and rate limiting
- Swagger documentation for API endpoints

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Redis
- TypeORM
- Cloudinary
- Zarinpal payment gateway
- Swagger UI
- Jest / Supertest

## Prerequisites

- Node.js 18+ or 22+ installed
- npm 10+ installed
- PostgreSQL database
- Redis server
- Docker and Docker Compose (optional)

## Installation

```bash
git clone https://github.com/amirAghayari/ticket-express.git
cd ticket-express
npm ci
```

## Configuration

1. Copy `.env.example` to `.env`.
2. Fill in the required values for the database, Redis, JWT secrets, email service, Cloudinary, and Zarinpal.
3. Make sure `.env` is never committed to source control.

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker compose up -d --build
```

## API Endpoints / Core Logic

### Public routes
- `GET /` — health check
- `GET /docs` — Swagger API documentation
- `POST /api/V1/users/signup` — register user
- `POST /api/V1/users/login` — login user
- `POST /api/V1/users/refresh-token` — refresh JWT token
- `POST /api/V1/users/forgot-password` — request password reset email
- `PATCH /api/V1/users/reset-password?resetToken=...` — reset password with token
- `GET /api/V1/events` — list events
- `GET /api/V1/events/:id` — get event details
- `GET /api/V1/events/:eventId/tickets` — get tickets for an event
- `GET /api/V1/payments/verify` — Zarinpal callback verification

### Authenticated routes
- `POST /api/V1/users/logout` — clear auth cookies
- `GET /api/V1/users/me` — get current user profile
- `PATCH /api/V1/users/me` — update current user profile
- `PATCH /api/V1/users/me/update-password` — change current user password
- `PATCH /api/V1/users/avatar` — upload user avatar
- `POST /api/V1/events` — create event
- `POST /api/V1/events/:eventId/tickets` — create ticket for event
- `PATCH /api/V1/events/:id` — update event
- `DELETE /api/V1/events/:id` — delete event
- `POST /api/V1/reservations` — create reservation
- `GET /api/V1/reservations/me` — get current user reservations
- `GET /api/V1/reservations/:id` — get reservation by ID
- `PATCH /api/V1/reservations/:id/cancel` — cancel reservation
- `POST /api/V1/payments` — create payment

### Admin routes
- `GET /api/V1/users` — list users
- `POST /api/V1/users` — create user as admin
- `GET /api/V1/users/get-daily-users-count` — user growth stats
- `GET /api/V1/users/:id` — get user by ID
- `PATCH /api/V1/users/:id` — update user by admin
- `DELETE /api/V1/users/:id` — delete user
- `GET /api/V1/reservations` — list all reservations
- `GET /api/V1/reservations/status/:status` — list reservations by status
- `DELETE /api/V1/reservations/:id` — delete reservation
- `GET /api/V1/payments/me` — get my payments
- `GET /api/V1/payments/:id` — get payment by ID
- `DELETE /api/V1/payments/:id` — delete payment

## Testing

```bash
npm test
npm run test:coverage
```

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add ..."`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request.

Please follow standard GitHub contribution practices and keep code style consistent.

## License

This project is licensed under the ISC License. See `LICENSE` for details.
