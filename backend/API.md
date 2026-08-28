# CompGo Backend API - Client Auth

## Base URLs

| Group | Base URL |
|---|---|
| Client (register/login) | `http://<host>:3000/clientapi/v1` |
| Shared (refresh/logout) | `http://<host>:3000/api/v1` |

## Required Headers

```
x-device-id: <UUID generated once per device, stored locally>
Authorization: Bearer <accessToken>   (only on /auth/logout for now)
```

## 1. Register

`POST /clientapi/v1/auth/register`

Request:
```json
{ "name": "Moaz Ashraf", "phone": "01012345678", "gender": "MALE", "password": "test1234" }
```

Response `201`:
```json
{ "status": "success", "data": { "client": { "id": "uuid", "name": "...", "phone": "...", "gender": "MALE", "accountType": "CLIENT" } } }
```

Errors: `409` phone already registered.

## 2. Login

`POST /clientapi/v1/auth/login`

Headers: `x-device-id`

Request:
```json
{ "phone": "01012345678", "password": "test1234" }
```

Response `200`:
```json
{ "status": "success", "data": { "clientId": "uuid", "accessToken": "eyJ...", "refreshToken": "38f9..." } }
```

Errors: `400` missing `x-device-id`, `401` invalid credentials or account blocked.

## 3. Refresh

`POST /api/v1/auth/refresh`

Headers: `x-device-id` (same device as login)

Request:
```json
{ "refreshToken": "38f9b04c..." }
```

Response `200`:
```json
{ "status": "success", "data": { "accessToken": "eyJ... (new)", "refreshToken": "a1b2c3... (new)" } }
```

Always overwrite stored tokens with the new pair. Errors: `400` missing fields, `401` invalid/expired/revoked token → clear local storage, go to login.

## 4. Logout

`POST /api/v1/auth/logout`

Headers: `Authorization: Bearer <accessToken>`

Response `200`:
```json
{ "status": "success", "message": "Logged out successfully" }
```

Clear local tokens immediately on the client side regardless of network response.

## Token Lifetimes

| Token | Lifetime |
|---|---|
| Access Token | 15 minutes |
| Refresh Token | 30 days (renewed on every refresh) |

## Suggested Flutter Flow

1. Store `accessToken`/`refreshToken` in `flutter_secure_storage` after register/login.
2. Generate `deviceId` once (UUID), store it, send it on every request.
3. On `401` from any protected request, call `/auth/refresh`.
4. On refresh success, overwrite stored tokens and retry the original request.
5. On refresh `401`, clear tokens and go to the login screen.
6. Use a `Dio` interceptor to automate steps 3-5.