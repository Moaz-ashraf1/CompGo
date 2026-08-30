# CompGo Backend API Documentation

## Base URLs

| Group                                                                    | Base URL                           |
| ------------------------------------------------------------------------ | ---------------------------------- |
| Client (register/login)                                                  | `http://<host>:3000/clientapi/v1`  |
| Captain (register/login)                                                 | `http://<host>:3000/captainapi/v1` |
| Everything else (auth refresh/logout, captains admin, pricing, boundary) | `http://<host>:3000/api/v1`        |

> Response envelope shape is not 100% consistent across modules — client/captain auth, client/captain profile, and shared auth use `{ status, data }`, while captain-admin/pricing/boundary use `{ message, data }`. Documented exactly as implemented.

---

## 1. Client Auth (`/clientapi/v1/auth`)

Client and Captain are fully independent accounts — no shared `User` table. Each has its own `id`, `name`, `phone` (unique per role), `gender`, and `passwordHash`.

### `POST /clientapi/v1/auth/register`

Request:

```json
{
  "name": "Moaz Ashraf",
  "phone": "01012345678",
  "gender": "MALE",
  "password": "test1234"
}
```

------

- `name`: 3-100 chars, `phone`: Egyptian format, `gender`: `MALE`|`FEMALE`, `password`: min 8 chars

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

Errors: `409` phone already registered as a client.

### `POST /clientapi/v1/auth/login`

Headers: `x-device-id: <device-uuid>`

Request:

```json
{ "phone": "01012345678", "password": "test1234" }
```

Response `200`:

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

Errors: `400` missing `x-device-id`, `401` invalid credentials or account `BLOCKED`.

---

## 1.5 Client Profile (`/clientapi/v1`)

Protected routes - require a valid CLIENT access token.

Headers: `Authorization: Bearer <accessToken>`

### `GET /clientapi/v1/me`

Response `200`:

```json
{
  "status": "success",
  "data": {
    "client": { "id": "uuid", "name": "...", "phone": "...", "gender": "MALE" }
  }
}
```

Errors: `401` missing/invalid access token, or the account no longer exists.

### `PATCH /clientapi/v1/me`

Request (send `name`, `phone`, or both - at least one required):

```json
{ "name": "New Name" }
```

or

```json
{ "phone": "01099999999" }
```

Response `200`:

```json
{
  "status": "success",
  "data": {
    "client": { "id": "uuid", "name": "...", "phone": "...", "gender": "MALE" }
  }
}
```

Errors:

- `400` no fields provided, or invalid phone format
- `401` missing/invalid access token, or the account no longer exists
- `409` phone already in use by another client

> Changing phone does **not** invalidate current tokens (they're keyed by account `id`, not phone) and does **not** require re-login. It only affects future logins (must use the new phone).

---

## 2. Captain Auth (`/captainapi/v1/auth`)

Same pattern as client auth, fully independent account. No admin approval required — a captain can log in immediately after registering.

### `POST /captainapi/v1/auth/register`

Request:

```json
{
  "name": "Ahmed Ali",
  "phone": "01099998888",
  "gender": "MALE",
  "password": "test1234",
  "nationalIdImage": "https://example.com/id.jpg",
  "licenseImage": "https://example.com/license.jpg",
  "vehicleNumber": "TEST-001",
  "vehicleType": "CAR",
  "vehicleModel": "Toyota Corolla 2020"
}
```

- `vehicleType`: `MOTORCYCLE`|`CAR`|`BICYCLE`. `nationalIdImage`/`licenseImage` must be URLs. `password`: min 8 chars.

Response `201`:

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

Errors: `409` phone already registered as a captain, or vehicle number already registered.

### `POST /captainapi/v1/auth/login`

Headers: `x-device-id: <device-uuid>`

Request:

```json
{ "phone": "01099998888", "password": "test1234" }
```

Response `200`:

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

Errors: `400` missing `x-device-id`, `401` invalid credentials or account `BLOCKED`.

---

## 2.5 Captain Profile (`/captainapi/v1`)

Protected routes - require a valid CAPTAIN access token.

Headers: `Authorization: Bearer <accessToken>`

### `GET /captainapi/v1/me`

Response `200`:

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

Errors: `401` missing/invalid access token, or the account no longer exists.

### `PATCH /captainapi/v1/me`

Request (send `name`, `phone`, or both - at least one required):

```json
{ "name": "New Name" }
```

or

```json
{ "phone": "01099999999" }
```

Response `200`:

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

Errors:

- `400` no fields provided, or invalid phone format
- `401` missing/invalid access token, or the account no longer exists
- `409` phone already in use by another captain

> Vehicle/license data (`vehicleNumber`, `vehicleType`, `vehicleModel`, `nationalIdImage`, `licenseImage`) is not editable via this endpoint yet.

---

## 3. Shared Auth (`/api/v1/auth`)

Works identically for CLIENT or CAPTAIN sessions (role is embedded in the token, not the URL) — used by both apps.

### `POST /api/v1/auth/refresh`

Headers: `x-device-id: <same device-uuid used at login>`

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

Rotation: the old refresh token is invalidated immediately — always overwrite stored tokens with the new pair.

Errors: `400` missing fields, `401` invalid/expired/revoked token. A revoked-token reuse revokes the entire session family (theft detection) — treat as "session ended, log in again."

### `POST /api/v1/auth/logout`

Headers: `Authorization: Bearer <accessToken>`

Response `200`:

```json
{ "status": "success", "message": "Logged out successfully" }
```

Revokes the current session (all refresh tokens sharing the same login's family). The access token itself stays technically valid until it naturally expires (≤15 min) since it's stateless — clear it client-side immediately regardless.

Errors: `401` missing/invalid/expired access token.

---

## 4. Captains Admin (`/api/v1/captains`)

⚠️ **Not protected yet** — no `authenticate`/`authorize` middleware applied. Anyone can call these without logging in. Intended for an admin panel, not for captains themselves (captains use `/captainapi/v1/auth` and `/captainapi/v1/me` above).

### `GET /api/v1/captains`

Response `200`:

```json
{ "data": [{ "id": "uuid", "name": "...", "status": "ACTIVE", "...": "..." }] }
```

### `GET /api/v1/captains/:id`

Response `200`:

```json
{ "data": { "id": "uuid", "name": "...", "amountDue": "0.00", "...": "..." } }
```

Errors: `404` captain not found.

### `PATCH /api/v1/captains/:id/block`

Sets `status = BLOCKED`. Response `200`:

```json
{ "message": "Captain blocked successfully", "data": { "...": "..." } }
```

### `PATCH /api/v1/captains/:id/unblock`

Sets `status = ACTIVE`. Response `200`:

```json
{ "message": "Captain unblocked successfully", "data": { "...": "..." } }
```

### `PATCH /api/v1/captains/:id/reset-amount-due`

Resets `amountDue` to `0`. Response `200`:

```json
{ "message": "Captain amount due reset successfully", "data": { "...": "..." } }
```

---

## 5. Compound Boundary (`/api/v1/compound-boundary`)

Single record representing the polygon boundary of the compound.

### `GET /api/v1/compound-boundary`

Response `200`:

```json
{
  "data": {
    "id": "uuid",
    "points": [{ "lat": 30.123, "lng": 31.456 }, "..."],
    "updatedAt": "..."
  }
}
```

`data` is `null` if unset.

### `PUT /api/v1/compound-boundary`

Request:

```json
{
  "points": [
    { "lat": 30.123, "lng": 31.456 },
    { "lat": 30.124, "lng": 31.457 },
    { "lat": 30.125, "lng": 31.458 }
  ]
}
```

At least 3 `{ lat, lng }` points. Upsert semantics.

Response `200`:

```json
{
  "message": "Compound boundary updated successfully",
  "data": { "id": "uuid", "points": ["..."] }
}
```

---

## 6. Pricing (`/api/v1/pricing`)

Single record with the compound's pricing configuration.

### `GET /api/v1/pricing`

Response `200`:

```json
{
  "data": {
    "id": "uuid",
    "rideInsideCompoundPrice": "10.00",
    "rideOutsidePricePerKm": "5.00",
    "orderInsideCompoundPrice": "15.00",
    "airportPrice": "100.00"
  }
}
```

`data` is `null` if unset.

### `PUT /api/v1/pricing`

Request:

```json
{
  "rideInsideCompoundPrice": 10,
  "rideOutsidePricePerKm": 5,
  "orderInsideCompoundPrice": 15,
  "airportPrice": 100
}
```

All fields required, positive numbers. Upsert semantics.

Response `200`:

```json
{
  "message": "Pricing updated successfully",
  "data": { "id": "uuid", "...": "..." }
}
```

---

## 7. Auth Headers Reference

```
x-device-id: <UUID generated once per device, stored locally>       # required on client/captain login + refresh
Authorization: Bearer <accessToken>                                  # required on /auth/logout, /me
```

## 8. Token Lifetimes

| Token         | Lifetime                                      |
| ------------- | --------------------------------------------- |
| Access Token  | 15 minutes                                    |
| Refresh Token | 30 days (renewed on every successful refresh) |

## 9. Suggested Flutter Flow

1. Store `accessToken`/`refreshToken` in `flutter_secure_storage` after register/login.
2. Generate `deviceId` once per install (UUID), store it, send it on every request that needs it.
3. On `401` from a protected request, call `/auth/refresh`.
4. On refresh success, overwrite stored tokens and retry the original request.
5. On refresh `401`, clear tokens and go to the login screen.
6. On logout, call `/auth/logout` and clear local tokens immediately regardless of the response.
7. Use a `Dio` interceptor to automate steps 3-6 globally.
8. Applies identically to the captain app, just pointed at `/captainapi/v1/auth` and `/captainapi/v1/me` instead of the client equivalents.
