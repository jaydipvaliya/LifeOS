# LifeOS — REST API Conventions

All endpoints are versioned under `/api/v1`.

## Standard Success Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-11-26T08:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## Standard Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Request validation failed",
    "details": [
      {
        "field": "body.email",
        "message": "Please enter a valid email address"
      }
    ]
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-11-26T08:00:00.000Z"
  }
}
```

## Available Endpoints (Day 2)

- `GET /api/v1/health` — Returns service status, uptime, and database/dependency health checks.
- `GET /api/v1/docs/openapi.json` — Returns the OpenAPI 3.1 JSON specification.
- `POST /api/v1/auth/register` — Register a new user with explicit DPDP privacy consent.
- `POST /api/v1/auth/login` — Authenticate with email/password and register device session.
- `POST /api/v1/auth/refresh` — Rotate refresh token with token-family reuse detection.
- `POST /api/v1/auth/logout` — Revoke current refresh token and device session (Bearer auth).
- `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password` — Password reset workflow.
- `GET /api/v1/auth/sessions` & `DELETE /api/v1/auth/sessions/:deviceId` — Device session management (Bearer auth).
- `DELETE /api/v1/auth/account` — Password-confirmed account soft-deletion (Bearer auth).
- `GET /api/v1/users/me` & `PATCH /api/v1/users/me/profile` — Authenticated user summary and onboarding profile updates (Bearer auth).
