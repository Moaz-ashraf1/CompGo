# CompGo Backend API Documentation

## Base URLs

| Group                                                  | Base URL                          |
| ------------------------------------------------------ | --------------------------------- |
| Client (register/login)                                | `http://<host>:3000/clientapi/v1` |
| Everything else (captains, pricing, boundary, refresh) | `http://<host>:3000/api/v1`       |

> Note: response envelopes are not 100% consistent across modules yet — client/auth uses `{ status, data }`, while captain/pricing/boundary use `{ message, data }`. Documented exactly as implemented below.

---

## 1. Client Auth (`/clientapi/v1/auth`)

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

- `name`: 3-100 chars
- `phone`: Egyptian format (`01[0125]xxxxxxxx`)
- `gender`: `MALE` | `FEMALE`
- `password`: min 8 chars

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

---

## 2. Shared Auth (`/api/v1/auth`)

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

Errors: `400` missing fields, `401` invalid/expired/revoked token (theft detected → whole session family revoked, user must log in again).

> Not yet implemented: `POST /api/v1/auth/logout`, captain register/login.

---

## 3. Captains (`/api/v1/captains`)

No auth/admin guard is currently applied on these routes — anyone can call them as-is.

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

- `nationalIdImage` / `licenseImage`: must be valid URLs (upload the file elsewhere first, e.g. to storage, then send the URL)
- `vehicleType`: `MOTORCYCLE` | `CAR` | `BICYCLE`

Response `201`:

```json
{
  "message": "Captain registered successfully",
  "data": { "id": "uuid", "...": "..." }
}
```

> Note: this creates a `Captain` record but does **not** issue tokens (no login flow for captains yet) and doesn't currently set a `passwordHash` field in the request — check `captain.service.ts` before wiring this to a real signup flow.

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

Sets `status = BLOCKED`.

Response `200`:

```json
{ "message": "Captain blocked successfully", "data": { "...": "..." } }
```

### `PATCH /api/v1/captains/:id/unblock`

Sets `status = ACTIVE`.

Response `200`:

```json
{ "message": "Captain unblocked successfully", "data": { "...": "..." } }
```

### `PATCH /api/v1/captains/:id/reset-amount-due`

Resets `amountDue` to `0`.

Response `200`:

```json
{ "message": "Captain amount due reset successfully", "data": { "...": "..." } }
```

---

## 4. Compound Boundary (`/api/v1/compound-boundary`)

Single record representing the polygon boundary of the compound (used to decide "inside vs outside" pricing).

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

Returns `null` in `data` if no boundary has been set yet.

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

- `points`: at least 3 `{ lat, lng }` pairs (a valid polygon)

Response `200`:

```json
{
  "message": "Compound boundary updated successfully",
  "data": { "id": "uuid", "points": ["..."] }
}
```

> Upsert semantics: creates the single boundary record if none exists, otherwise updates the existing one.

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

Returns `null` in `data` if no pricing config has been set yet.

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

All fields required, must be positive numbers.

Response `200`:

```json
{
  "message": "Pricing updated successfully",
  "data": { "id": "uuid", "...": "..." }
}
```

> Upsert semantics, same as boundary.

---

## 6. Auth Headers Reference

```
x-device-id: <UUID generated once per device, stored locally>       # required on client login + refresh
Authorization: Bearer <accessToken>                                  # required on protected routes (none currently enforced except where you add `authenticate` manually)
```

---

## 7. Known Gaps (as of this writing)

- No `authenticate`/`authorize` middleware is actually applied to any route yet (captains/pricing/boundary are fully open).
- No captain register/login/auth flow — captains exist in the DB but can't authenticate.
- No `logout` endpoint.
- Response envelope shape is inconsistent between modules (`status/data` vs `message/data`).
