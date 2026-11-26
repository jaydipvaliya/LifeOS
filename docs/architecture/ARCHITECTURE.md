# LifeOS — Technical Architecture

## 1. Product & Engineering Overview

**LifeOS** (_Your life, organized._) is an Android-first, offline-capable personal life administration platform designed around a single core principle:

`DOCUMENT -> UNDERSTAND -> CONNECT -> REMIND -> ACT`

Rather than storing files, tasks, calendar dates, assets, and subscriptions in disconnected tools, LifeOS converts scanned or uploaded personal documents into verified structured records, links them to assets and responsibilities, schedules explicit reminders, and answers natural-language queries with verifiable source citations.

---

## 2. Monorepo Architecture

```text
lifeos/
├── apps/
│   ├── mobile/          # React Native (Expo SDK + Expo Router + TypeScript)
│   ├── api/             # Express.js TypeScript Modular Monolith REST API
│   └── worker/          # BullMQ background job processor (OCR, AI, reminders, push)
├── packages/
│   ├── shared-types/    # Shared domain models, enums, API response envelopes
│   ├── validation/      # Shared Zod schemas (auth, pagination, AI extraction)
│   ├── config/          # Shared constants, upload limits, API version, defaults
│   └── design-tokens/   # Warm Minimal x Editorial color, typography, spacing tokens
├── docs/
│   ├── architecture/    # System architecture & security specifications
│   ├── api/             # REST conventions & OpenAPI documentation
│   └── database/        # PostgreSQL & Prisma schema design
├── infrastructure/      # Future Docker / Render / deployment configs
└── .github/             # CI/CD workflows
```

### Dependency Boundaries

- `packages/*` contain zero framework-specific runtime side effects and compile cleanly via TypeScript project references.
- `apps/api` and `apps/worker` share domain contracts via `@lifeos/shared-types`, `@lifeos/validation`, and `@lifeos/config`.
- `apps/mobile` consumes `@lifeos/design-tokens`, `@lifeos/shared-types`, `@lifeos/validation`, and `@lifeos/config` without coupling to backend database or server internals.

---

## 3. Mobile Application Architecture (`apps/mobile`)

- **Framework**: React Native + Expo SDK + TypeScript + Expo Router.
- **Navigation**: Five primary bottom tabs (`Home`, `Vault`, `Calendar`, `Assets`, `Profile`) plus modal routes for document scanning, quick actions, extraction verification, and the Life AI Assistant.
- **State Management**:
  - **TanStack Query** for server-synchronized state, caching, and optimistic mutations.
  - **Zustand** for lightweight client UI, auth session hydration, and sync status state.
  - **React Hook Form + Zod** (`@lifeos/validation`) for deterministic form validation.
- **Offline-First Engine (Day 5)**:
  - **Expo SQLite** local mirror for document metadata, tasks, events, assets, and subscriptions.
  - **Sync Outbox** (`sync_operations`) queuing offline mutations with record version checks and optimistic concurrency conflict detection.
- **Device Security & Capture**:
  - **Expo SecureStore** for refresh tokens and biometric lock state.
  - **Expo Camera / Image Picker / Local Authentication / Notifications** for real device workflows.
- **Design System**: Warm Minimal × Editorial (`#F7F8F5` primary canvas, `#253A32` deep forest primary, Manrope headings, Inter body, DM Serif Display selective editorial titles, Lucide icons).

---

## 4. Backend Modular Monolith (`apps/api`)

LifeOS uses a **modular monolith** rather than premature microservices to keep transactional boundaries simple, enforce strict ownership checks, and iterate quickly while keeping clean module isolation.

Each domain module (`auth`, `users`, `documents`, `scanner`, `extraction`, `events`, `tasks`, `reminders`, `assets`, `subscriptions`, `search`, `ai`, `notifications`, `devices`) separates:

1. **Routes** — HTTP routing, rate limiting, auth & Zod request validation middleware.
2. **Controllers** — Request parsing and standardized JSON envelope responses (`sendSuccess` / `sendError`).
3. **Services** — Business logic, authorization assertions, transaction coordination.
4. **Repositories** — Prisma data access scoped strictly by authenticated `userId`.
5. **Validators & Types** — Module-specific Zod schemas and DTOs.

### Cross-Cutting Controls

- **Request Tracing**: `x-request-id` propagated into Pino structured logs and API response metadata.
- **Security Headers & CORS**: `helmet`, strict origin allowlist, `x-powered-by` disabled.
- **Error Handling**: Centralized `AppError` hierarchy preventing internal stack traces from leaking to clients.
- **API Documentation**: Versioned under `/api/v1` with OpenAPI 3.1 specification at `/api/v1/docs/openapi.json`.

---

## 5. Asynchronous Processing (`apps/worker`)

Long-running and scheduled operations run outside HTTP request lifecycles using **Redis + BullMQ**:

- `lifeos.document.extraction`: OCR text extraction → AI classification → structured JSON extraction → Zod schema validation → `needs_review` status.
- `lifeos.reminder.dispatch`: Evaluates scheduled document expiry, warranty, subscription, and task reminders.
- `lifeos.notification.push`: Delivers privacy-preserving push payloads via Expo Push Notifications.

---

## 6. Storage, Security & Privacy (DPDP-Aligned)

- **PostgreSQL + Prisma**: Authoritative relational store with UUID PKs, `TIMESTAMPTZ`, `DATE`, `NUMERIC` for currency, and `JSONB` for validated AI extraction payloads.
- **Private S3-Compatible Object Storage**: Document binaries are never stored in PostgreSQL or served from public URLs. Access uses short-lived presigned upload/download URLs generated only after server-side ownership authorization, MIME + magic-byte signature validation, and audit logging.
- **Authentication**: Argon2id/bcrypt password hashing, short-lived JWT access tokens (15m), rotating refresh tokens (30d) stored hashed per device session, and explicit session revocation.
- **Privacy & Consent**: Explicit consent capture during registration, transparent data export, and full account deletion workflows aligned with India's Digital Personal Data Protection (DPDP) Act principles.
- **AI Guardrails**: AI providers are abstracted behind a unified `AIProvider` interface. AI outputs are validated with strict Zod schemas, display confidence scores and source locations, never fabricate missing fields, and never trigger events, reminders, or financial mutations without explicit user verification.
