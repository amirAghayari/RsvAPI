# Authentication (JWT)

This project implements email/password auth with Access & Refresh JWT tokens.

## Environment variables

- `JWT_ACCESS_SECRET` - secret used to sign access tokens
- `JWT_REFRESH_SECRET` - secret used to sign refresh tokens
- `ACCESS_TOKEN_EXPIRES_IN` - e.g. `15m`
- `REFRESH_TOKEN_EXPIRES_IN` - e.g. `7d`

See `.env.example`.

## Password policy

- Minimum 8 characters
- Only letters and digits
- At least one uppercase, one lowercase letter, and one digit

## Endpoints

- POST /auth/register

  - body: { email, name, password }
  - returns: { id, email, name }

- POST /auth/login

  - body: { email, password }
  - returns: { accessToken, refreshToken }

- POST /auth/refresh

  - body: { refreshToken }
  - returns: { accessToken, refreshToken }

- POST /auth/logout

  - body: { userId }
  - returns: { ok: true }

- GET /me (protected)
  - header: Authorization: Bearer <accessToken>
  - returns: { id }

## Manual test using curl

1. Register

curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"email":"a@example.com","name":"Ali","password":"Abcd1234"}'

2. Login

curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"a@example.com","password":"Abcd1234"}'

3. Use access token to call protected route

curl http://localhost:3000/me -H "Authorization: Bearer <accessToken>"

4. When access expires, refresh with refresh token

curl -X POST http://localhost:3000/auth/refresh -H "Content-Type: application/json" -d '{"refreshToken":"<refreshToken>"}'
