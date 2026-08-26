# Authentication System Documentation

## 1. Overview

This system uses a two-token strategy:

- **Access Token** (JWT, 15 min lifetime): stateless, verified via HMAC signature, carries `sub` (user id), `role`, and `familyId`.
- **Refresh Token** (random string, 30 day lifetime): stored hashed in the DB, used to silently renew the access token without forcing the user to log in again.

Refresh tokens use **rotation**: every refresh invalidates the old token and issues a new one in the same "family." If a revoked token is ever reused, it signals theft and the entire family is revoked (all sessions from that login are killed at once).

---

## 2. Environment Variables

Add to `backend/.env`:

```
ACCESS_TOKEN_SECRET=<long random string, e.g. from: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
```

---

## 3. Database Schema (`backend/prisma/schema.prisma`)

```prisma
enum AccountRole {
  CLIENT
  CAPTAIN
}

model RefreshToken {
  id        String      @id @default(uuid())
  userId    String
  role      AccountRole
  tokenHash String      @unique
  familyId  String
  deviceId  String
  ipAddress String
  revoked   Boolean     @default(false)
  expiresAt DateTime
  createdAt DateTime    @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([familyId])
}
```

Added to `User`:

```prisma
refreshTokens RefreshToken[]
```

| Field       | Purpose                                                                          |
| ----------- | -------------------------------------------------------------------------------- |
| `tokenHash` | SHA-256 hash of the raw refresh token (never store the raw value)                |
| `role`      | CLIENT or CAPTAIN — same `User` can have sessions of both, distinguished per-row |
| `familyId`  | Groups all tokens from one login session (login → rotate → rotate → ...)         |
| `deviceId`  | Groups sessions by physical device, enables per-device logout                    |
| `revoked`   | Set true on rotation, logout, or theft detection                                 |

---

## 4. Backend Modules

| File                                                    | Responsibility                                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/utils/jwt.ts`                                      | `generateAccessToken` / `verifyAccessToken` (JWT sign/verify)                                  |
| `src/utils/token.ts`                                    | `generateRefreshToken` (random bytes) / `hashRefreshToken` (SHA-256)                           |
| `src/modules/auth/token.repository.ts`                  | Raw DB access for `RefreshToken` rows                                                          |
| `src/modules/auth/token.service.ts`                     | `issueTokenPair` (login/rotation) and `rotateRefreshToken` (refresh + reuse detection)         |
| `src/modules/auth/auth.controller.ts` + `auth.route.ts` | Shared `POST /auth/refresh` endpoint (works for both CLIENT and CAPTAIN)                       |
| `src/modules/client/auth/*`                             | Client-specific register/login, calls `token.service` to issue tokens on login                 |
| `src/middlewares/auth.middleware.ts`                    | `authenticate` (verifies access token, sets `req.user`) and `authorize(...roles)` (role guard) |
| `src/types/express.d.ts`                                | Type augmentation for `req.user: { id, role, familyId }`                                       |

---

## 5. Access Token Payload (JWT)

```json
{
  "sub": "user_123",
  "role": "CLIENT",
  "familyId": "fam_1",
  "iat": 1735200000,
  "exp": 1735200900
}
```

`iat`/`exp` are injected automatically by `jsonwebtoken` based on the `expiresIn` option — not set manually.

---

## 6. Endpoints

### Base URLs

| Group                   | Base URL                          |
| ----------------------- | --------------------------------- |
| Client (register/login) | `http://<host>:3000/clientapi/v1` |
| Shared (refresh)        | `http://<host>:3000/api/v1`       |

### Required Headers

```
x-device-id: <UUID generated once per device, stored locally>
Authorization: Bearer <accessToken>   (on protected routes)
```

### `POST /clientapi/v1/auth/register`

Request:

```json
{
  "name": "Moaz Ashraf",
  "phone": "01012345678",
  "gender": "MALE",
  "password": "yourPassword123"
}
```

Response `201`:

```json
{
  "status": "success",
  "data": {
    "client": {
      "id": "uuid",
      "name": "...",
      "phone": "...",
      "gender": "MALE",
      "accountType": "CLIENT"
    }
  }
}
```

### `POST /clientapi/v1/auth/login`

Headers: `x-device-id`

Request:

```json
{ "phone": "01012345678", "password": "yourPassword123" }
```

Response `200`:

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "clientId": "uuid",
    "accessToken": "eyJ...",
    "refreshToken": "38f9..."
  }
}
```

Errors: `400` missing `x-device-id`, `401` invalid credentials or account `BLOCKED`.

### `POST /api/v1/auth/refresh`

Headers: `x-device-id` (must match the device used at login)

Request:

```json
{ "refreshToken": "38f9b04c1e52c215..." }
```

Response `200`:

```json
{
  "status": "success",
  "data": { "accessToken": "eyJ... (new)", "refreshToken": "a1b2c3... (new)" }
}
```

Errors:

| Status | Reason                                        | Client action                         |
| ------ | --------------------------------------------- | ------------------------------------- |
| 400    | Missing `refreshToken`/`x-device-id`          | Fix request                           |
| 401    | Invalid, expired, or revoked (theft detected) | Clear local tokens, redirect to login |

**Always replace the stored refresh token with the new one after every successful call** — the old one is revoked immediately (rotation).

---

## 7. Protecting a Route (backend usage)

```typescript
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

router.get("/me", authenticate, controller.me);
router.get(
  "/dashboard",
  authenticate,
  authorize("CAPTAIN"),
  controller.dashboard,
);
```

Inside the controller: `req.user.id`, `req.user.role`, `req.user.familyId` are available after `authenticate` runs.

---

## 8. Token Lifetimes

| Token         | Lifetime                                      |
| ------------- | --------------------------------------------- |
| Access Token  | 15 minutes                                    |
| Refresh Token | 30 days (renewed on every successful refresh) |

---

## 9. Suggested Flutter Flow

1. On app start, try the stored `accessToken`.
2. On any `401`, call `/auth/refresh` with the stored `refreshToken`.
3. On success, overwrite both stored tokens and retry the original request.
4. On refresh failure (`401`), clear all local tokens and redirect to login.
5. Use a `Dio` interceptor to automate steps 2-4 globally instead of repeating it per screen.

---

## 10. Not Yet Implemented

- `POST /auth/logout` — revoke current session's `familyId` (planned, uses `req.user.familyId`)
- Per-device session listing / "log out other devices"
- Captain register/login (currently only client auth exists)
