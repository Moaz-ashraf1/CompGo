````markdown
# CompGo Backend API Documentation

## Base URLs

| Group                                                              | Base URL                          |
| ------------------------------------------------------------------ | --------------------------------- |
| Client (register/login)                                            | `http://<host>:3000/clientapi/v1` |
| Everything else (auth refresh/logout, captains, pricing, boundary) | `http://<host>:3000/api/v1`       |

> Response envelope shape is not 100% consistent across modules — client/auth, client/profile, and shared auth use `{ status, data }`, while captain/pricing/boundary use `{ message, data }`. Documented exactly as implemented.

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
````

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

## 2. Shared Auth (`/api/v1/auth`)

Works identically for CLIENT or CAPTAIN sessions (role is embedded in the token, not the URL).

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

## 3. Captains (`/api/v1/captains`)

⚠️ **Known issue**: these endpoints predate the schema redesign (removal of the shared `User` table) and have not been updated yet. `POST /api/v1/captains` may currently fail or behave unexpectedly — do not rely on it until it's revisited. No captain login/auth flow exists yet at all.

### `POST /api/v1/captains`

Request:

```json
{
  "name": "Ahmed Ali",
  "phone": "01012345678",
  "gender": "MALE",
  "nationalIdImage": "https://.../id.jpg",
  "licenseImage": "https://.../license.jpg",
  "vehicleNumber": "ABC-1234",
  "vehicleType": "CAR",
  "vehicleModel": "Toyota Corolla 2020"
}
```

- `vehicleType`: `MOTORCYCLE`|`CAR`|`BICYCLE`. `nationalIdImage`/`licenseImage` must be URLs.

Response `201`:

```json
{
  "message": "Captain registered successfully",
  "data": { "id": "uuid", "...": "..." }
}
```

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

## 4. Compound Boundary (`/api/v1/compound-boundary`)

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

## 5. Pricing (`/api/v1/pricing`)

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

## 6. Auth Headers Reference

```
x-device-id: <UUID generated once per device, stored locally>       # required on client login + refresh
Authorization: Bearer <accessToken>                                  # required on /auth/logout, /me
```

## 7. Token Lifetimes

| Token         | Lifetime                                      |
| ------------- | --------------------------------------------- |
| Access Token  | 15 minutes                                    |
| Refresh Token | 30 days (renewed on every successful refresh) |

```

```
