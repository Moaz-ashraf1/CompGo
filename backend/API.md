# CompGo API - Complete Endpoint Reference

## Base URL

```
https://api.ingateapp.tech
```

## Auth Model

- **User (Client) and Captain**: register with phone + password, login returns `accessToken` (15 min) + `refreshToken` (30 days).
- **Admin**: no self-registration - accounts are created manually. Login works the same way (username + password → tokens).
- All three roles share the same refresh/logout mechanism (`/api/v1/auth/...`).
- `accessToken` goes in `Authorization: Bearer <token>` on every protected request.
- `x-device-id` (any stable UUID you generate once per device/install) is required on every login and refresh call.

---

# 1. USER (Client) App

Base path: `/clientapi/v1`

### `POST /clientapi/v1/auth/register`

**Request:**

```json
{
  "name": "Moaz Ashraf",
  "phone": "01012345678",
  "gender": "MALE",
  "password": "test1234"
}
```

**Response `201`:**

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

**Errors:** `409` phone already registered.

### `POST /clientapi/v1/auth/login`

Headers: `x-device-id`
**Request:**

```json
{ "phone": "01012345678", "password": "test1234" }
```

**Response `200`:**

```json
{
  "status": "success",
  "data": {
    "clientId": "uuid",
    "accessToken": "eyJ...",
    "refreshToken": "38f9..."
  }
}
```

**Errors:** `400` missing `x-device-id`, `401` invalid credentials or blocked account.

### `GET /clientapi/v1/me`

Headers: `Authorization: Bearer <accessToken>`
**Response `200`:**

```json
{
  "status": "success",
  "data": {
    "client": { "id": "uuid", "name": "...", "phone": "...", "gender": "MALE" }
  }
}
```

### `PATCH /clientapi/v1/me`

Headers: `Authorization: Bearer <accessToken>`
**Request** (send `name`, `phone`, or both):

```json
{ "name": "New Name" }
```

**Response `200`:** same shape as `GET /me`.
**Errors:** `400` nothing to update, `401` invalid token, `409` phone taken.

---

# 2. CAPTAIN App

Base path: `/captainapi/v1`

### `POST /captainapi/v1/auth/register`

**Request:**

```json
{
  "name": "Ahmed Ali",
  "phone": "01099998888",
  "gender": "MALE",
  "password": "test1234",
  "nationalIdImage": "https://.../id.jpg",
  "licenseImage": "https://.../license.jpg",
  "vehicleNumber": "ABC-1234",
  "vehicleType": "CAR",
  "vehicleModel": "Toyota Corolla 2020"
}
```

- `vehicleType`: `MOTORCYCLE` | `CAR` | `BICYCLE`
  **Response `201`:**

```json
{
  "status": "success",
  "data": {
    "captain": {
      "id": "uuid",
      "name": "...",
      "phone": "...",
      "gender": "MALE",
      "accountType": "CAPTAIN"
    }
  }
}
```

**Errors:** `409` phone or vehicle number already registered.

> No approval needed - a captain can log in immediately after registering.

### `POST /captainapi/v1/auth/login`

Headers: `x-device-id`
**Request:**

```json
{ "phone": "01099998888", "password": "test1234" }
```

**Response `200`:**

```json
{
  "status": "success",
  "data": {
    "captainId": "uuid",
    "accessToken": "eyJ...",
    "refreshToken": "..."
  }
}
```

### `GET /captainapi/v1/me`

Headers: `Authorization: Bearer <accessToken>`
**Response `200`:**

```json
{
  "status": "success",
  "data": {
    "captain": {
      "id": "uuid",
      "name": "...",
      "phone": "...",
      "gender": "MALE",
      "status": "ACTIVE",
      "amountDue": "0.00"
    }
  }
}
```

### `PATCH /captainapi/v1/me`

Headers: `Authorization: Bearer <accessToken>`
**Request:** `{ "name": "..." }` and/or `{ "phone": "..." }`
**Response `200`:** same shape as `GET /me`.

---

# 3. ADMIN (used by the dashboard's own backend, not the dashboard app directly)

Base path: `/adminapi/v1`

### `POST /adminapi/v1/auth/login`

Headers: `x-device-id`
**Request:**

```json
{ "username": "admin", "password": "Password123!" }
```

**Response `200`:**

```json
{
  "status": "success",
  "data": {
    "adminId": "uuid",
    "username": "admin",
    "accessToken": "eyJ...",
    "refreshToken": "..."
  }
}
```

**Errors:** `401` invalid credentials.

> No public registration - admin accounts are created manually by the backend team.

### `PATCH /adminapi/v1/captains/:id/phone`

Headers: `Authorization: Bearer <adminAccessToken>`
**Request:**

```json
{ "phone": "01055554444" }
```

**Response `200`:**

```json
{
  "status": "success",
  "data": { "captain": { "id": "uuid", "phone": "01055554444", "...": "..." } }
}
```

**Errors:** `401` invalid/missing token or not an admin, `404` captain not found, `409` phone in use.

### `PATCH /adminapi/v1/captains/:id/password`

**Request:** `{ "password": "newPassword123" }`
**Response `200`:** `{ "status": "success", "message": "Captain password reset successfully" }`

> Revokes all of that captain's active sessions.

### `PATCH /adminapi/v1/clients/:id/password`

**Request:** `{ "password": "newPassword123" }`
**Response `200`:** `{ "status": "success", "message": "Client password reset successfully" }`

---

# 4. DASHBOARD (data management - all require an ADMIN access token)

Base path: `/api/v1`

Headers: `Authorization: Bearer <adminAccessToken>` (get this from `POST /adminapi/v1/auth/login` above)

### `GET /api/v1/captains`

List all captains.
**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "...",
      "phone": "...",
      "status": "ACTIVE",
      "amountDue": "0.00",
      "...": "..."
    }
  ]
}
```

### `GET /api/v1/captains/:id`

**Response `200`:** `{ "data": { "id": "uuid", "...": "..." } }`
**Errors:** `404` not found.

### `PATCH /api/v1/captains/:id/block`

**Response `200`:** `{ "message": "Captain blocked successfully", "data": { "...": "..." } }`

### `PATCH /api/v1/captains/:id/unblock`

**Response `200`:** `{ "message": "Captain unblocked successfully", "data": { "...": "..." } }`

### `PATCH /api/v1/captains/:id/reset-amount-due`

**Response `200`:** `{ "message": "Captain amount due reset successfully", "data": { "...": "..." } }`

### `GET /api/v1/compound-boundary`

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "points": [{ "lat": 30.0131, "lng": 31.2089 }],
    "updatedAt": "..."
  }
}
```

`data` is `null` if unset.

### `PUT /api/v1/compound-boundary`

**Request:** `{ "points": [ { "lat": ..., "lng": ... }, ... ] }` (at least 3 points)
**Response `200`:** `{ "message": "Compound boundary updated successfully", "data": { "...": "..." } }`

### `GET /api/v1/pricing`

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "rideInsideCompoundPrice": "35",
    "rideOutsidePricePerKm": "5",
    "orderInsideCompoundPrice": "30",
    "airportPrice": "280",
    "updatedAt": "..."
  }
}
```

### `PUT /api/v1/pricing`

**Request:**

```json
{
  "rideInsideCompoundPrice": 35,
  "rideOutsidePricePerKm": 5,
  "orderInsideCompoundPrice": 30,
  "airportPrice": 280
}
```

**Response `200`:** `{ "message": "Pricing updated successfully", "data": { "...": "..." } }`

---

# 5. SHARED AUTH (used by all three: User, Captain, Admin)

Base path: `/api/v1/auth`

### `POST /api/v1/auth/refresh`

Headers: `x-device-id` (same device used at login)
**Request:** `{ "refreshToken": "..." }`
**Response `200`:**

```json
{
  "status": "success",
  "data": { "accessToken": "eyJ... (new)", "refreshToken": "... (new)" }
}
```

Always overwrite both stored tokens with the new pair - the old refresh token is invalidated immediately.

**Errors:** `401` invalid/expired/revoked token → clear local tokens, go to login. A revoked-token reuse revokes the whole session (possible theft) - same behavior, same handling.

### `POST /api/v1/auth/logout`

Headers: `Authorization: Bearer <accessToken>`
**Response `200`:** `{ "status": "success", "message": "Logged out successfully" }`
Clear local tokens client-side immediately regardless of the response.

---

# 6. Status Codes Quick Reference

| Code | Meaning                                               |
| ---- | ----------------------------------------------------- |
| 200  | Success                                               |
| 201  | Created                                               |
| 400  | Invalid request body / validation error               |
| 401  | Invalid/missing/expired token, or invalid credentials |
| 404  | Resource not found                                    |
| 409  | Conflict (duplicate phone/vehicle number/etc.)        |
| 500  | Server error - report to backend immediately          |

---

# 7. Recommended Client-Side Flow (all three apps)

1. Store `accessToken` + `refreshToken` in secure storage (`flutter_secure_storage`) after login.
2. Generate `deviceId` once per install, reuse it forever, send it on login/refresh.
3. On any `401` from a protected request → call `/api/v1/auth/refresh`.
4. On success → overwrite stored tokens, retry the original request.
5. On refresh failure (`401`) → clear tokens, redirect to login.
6. On logout → call `/api/v1/auth/logout`, then clear local tokens regardless of the response.
7. Use a `Dio` interceptor to automate steps 3-6 globally instead of repeating per screen.

---

# 8. Known Gaps (not built yet)

- Vehicle/license data on the captain profile is not editable via `PATCH /me` (only name/phone).
- No client listing/management endpoints for the dashboard yet (only password reset exists for clients).
- No self-service forgot-password flow - only admin-driven password resets.
