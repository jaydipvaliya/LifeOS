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

## Available Foundation Endpoints (Day 1)

- `GET /api/v1/health` — Returns service status, uptime, and dependency configuration indicators.
- `GET /api/v1/docs/openapi.json` — Returns the OpenAPI 3.1 JSON specification.
