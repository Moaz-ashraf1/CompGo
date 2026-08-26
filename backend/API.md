# Authentication API

## Base URLs

| Group                   | Base URL                          |
| ----------------------- | --------------------------------- |
| Client (register/login) | `http://<host>:3000/clientapi/v1` |
| Shared (refresh token)  | `http://<host>:3000/api/v1`       |

## Required Headers

Every request after login/register must include:

```
x-device-id: <a stable UUID generated once on the device and stored locally>
```

Protected routes (once added) will also require:

```
Authorization: Bearer <accessToken>
```

---

## 1. Register

`POST /clientapi/v1/auth/register`

### Request Body

```json
{
  "name": "Moaz Ashraf",
  "phone": "01012345678",
  "gender": "MALE",
  "password": "yourPassword123"
}
```

### Response `201 Created`

```json
{
  "status": "success",
  "data": {
    "client": {
      "id": "uuid",
      "name": "Moaz Ashraf",
      "phone": "01012345678",
      "gender": "MALE",
      "accountType": "CLIENT"
    }
  }
}
```

> Note: register does NOT return an accessToken/refreshToken - call login right after.

---

## 2. Login

`POST /clientapi/v1/auth/login`

### Headers

```
x-device-id: <device-uuid>
```

### Request Body

```json
{
  "phone": "01012345678",
  "password": "yourPassword123"
}
```

### Response `200 OK`

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "clientId": "uuid",
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "38f9b04c1e52c215..."
  }
}
```

### Errors

| Status | Reason                                        |
| ------ | --------------------------------------------- |
| 400    | Missing `x-device-id` header                  |
| 401    | Wrong phone/password, or account is `BLOCKED` |

### What to do with the result (Flutter side)

- Store `accessToken` and `refreshToken` in `flutter_secure_storage`
- Send `accessToken` via `Authorization: Bearer` on every protected request afterward

---

## 3. Refresh Token

`POST /api/v1/auth/refresh`

Call this when the `accessToken` is close to expiring (every 15 minutes) or when a protected route returns 401.

### Headers

```
x-device-id: <same device-uuid used at login>
```

### Request Body

```json
{
  "refreshToken": "38f9b04c1e52c215..."
}
```

### Response `200 OK`

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOi... (new)",
    "refreshToken": "a1b2c3... (new, replace the old one immediately)"
  }
}
```

**Important**: after every successful refresh, replace the old `refreshToken` in secure storage with the new one immediately. The old `refreshToken` becomes `revoked` and cannot be reused.

### Errors

| Status | Reason                                  | Required Action                                         |
| ------ | --------------------------------------- | ------------------------------------------------------- |
| 400    | Missing `refreshToken` or `x-device-id` | Fix the request                                         |
| 401    | `refreshToken` invalid/expired/revoked  | Perform a local logout and redirect to the login screen |

> A `401` from the refresh endpoint means the session is fully over - clear all locally stored tokens and send the user back to the login screen.

---

## Token Lifetimes

| Token         | Lifetime                                                    |
| ------------- | ----------------------------------------------------------- |
| Access Token  | 15 minutes                                                  |
| Refresh Token | 30 days (renewed automatically on every successful refresh) |

---

## Suggested Flutter Flow

1. On app start: if a stored `accessToken` exists, try using it.
2. If any request returns `401`, call `/auth/refresh` with the stored `refreshToken`.
3. If the refresh succeeds, store the new pair and retry the original request.
4. If the refresh fails with `401`, clear everything and redirect the user to the login screen.
5. Recommended: use a `Dio` interceptor to automate steps 2-4 on any 401, instead of repeating this logic on every screen.
