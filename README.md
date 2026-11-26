# LifeOS

**Your life, organized.**

LifeOS is an Android-first, offline-capable, AI-powered personal life administration platform designed with a **Warm Minimal × Editorial** visual identity. It unifies personal documents, deadlines, warranties, assets, subscriptions, tasks, and intelligent reminders into a single cohesive workflow:

`DOCUMENT → UNDERSTAND → CONNECT → REMIND → ACT`

---

## Core Capabilities

- **Document Vault & Scanner**: Capture multi-page documents on Android, store files in private S3-compatible object storage with short-lived presigned URLs, categorize, version, archive, and search.
- **Life Intelligence Engine**: Asynchronous OCR and AI extraction validated by strict Zod schemas. Every extracted field tracks confidence and requires explicit user verification before creating events, assets, or reminders.
- **Life Administration**: Unified management for Tasks, Life Calendar events, Assets & Warranties, Subscriptions, and server-scheduled Reminders.
- **Life AI Assistant & Universal Search**: Context-aware retrieval across your verified personal records with source citations and strict user-ownership isolation.
- **Offline-First Synchronization**: Expo SQLite local cache with a transactional sync outbox and optimistic concurrency conflict detection.

---

## Technology Stack

| Layer           | Technologies                                                                                                                                                                        |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile**      | React Native, Expo SDK, TypeScript, Expo Router, Zustand, TanStack Query, Axios, React Hook Form, Zod, Expo SQLite, Expo SecureStore, Expo Camera, Expo Notifications, Lucide Icons |
| **Backend API** | Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL, Redis, Zod, JWT, Argon2id/bcrypt, Pino, OpenAPI 3.1                                                                        |
| **Worker**      | BullMQ, Redis, IORedis, TypeScript                                                                                                                                                  |
| **Storage**     | PostgreSQL (structured data + JSONB), Private S3-compatible object storage (binaries), SQLite (offline local cache)                                                                 |
| **Tooling**     | npm workspaces, ESLint, Prettier, Vitest, Supertest, GitHub Actions, EAS Build                                                                                                      |

---

## Monorepo Structure

```text
lifeos/
├── apps/
│   ├── mobile/          # Expo React Native mobile client
│   ├── api/             # Express TypeScript modular monolith REST API
│   └── worker/          # BullMQ asynchronous job worker
├── packages/
│   ├── shared-types/    # Shared domain & API response types
│   ├── validation/      # Shared Zod schemas
│   ├── config/          # Shared constants & policy defaults
│   └── design-tokens/   # Warm Minimal x Editorial theme tokens
├── docs/
│   ├── architecture/    # System architecture docs
│   ├── api/             # REST conventions
│   ├── database/        # PostgreSQL schema design
│   ├── DEVELOPMENT_LOG.md
│   └── IMPLEMENTATION_CHECKLIST.md
└── README.md
```

---

## Design System — Material 3 Expressive × Warm Minimal Editorial

- **Tonal Palette**: Warm Minimal forest & sage hues mapped to Material 3 tonal roles (`#F7F8F5` surface, `#EEF1EA` surfaceContainer, `#253A32` primary, `#E6EEE7` primaryContainer, `#526F60` secondary, `#9C6A23` warm amber tertiary)
- **Shapes & Motion**: Large squircle cards (`20–28px`), pill buttons & active tab indicators, Reanimated spring physics (`expressiveSpatial` / `expressiveEffects`)
- **Typography**: `Manrope` for headings, `Inter` for body text, `DM Serif Display` selectively for editorial titles

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- PostgreSQL 15+ and Redis 7+ (required starting Day 2)

### Installation

```bash
npm install
npm run build
```

### Environment Variables

Copy the example environment files and provide local values (never commit `.env` files):

- `apps/api/.env.example` → `apps/api/.env`
- `apps/worker/.env.example` → `apps/worker/.env`
- `apps/mobile/.env.example` → `apps/mobile/.env`

### Development Commands

```bash
# Run Express API in watch mode
npm run dev:api

# Run BullMQ worker in watch mode
npm run dev:worker

# Start Expo Metro bundler for mobile
npm run dev:mobile

# Run TypeScript checks, linting, formatting checks, and tests
npm run typecheck
npm run lint
npm run format:check
npm run test
```

---

## Five-Day Build Status

- **Day 1 (Completed)**: Monorepo setup, shared TypeScript packages, design tokens & mobile UI primitives, Expo Router foundation, Express API skeleton, BullMQ worker skeleton, architecture & planning docs.
- **Day 2 (Completed)**: PostgreSQL + Prisma 22-table schema and `0001_init` migration SQL, Argon2id + JWT access/refresh-token rotation, mobile SecureStore + Axios refresh interceptor + auth/onboarding flow.
- **Day 3 (Completed)**: Material 3 Expressive UI upgrade across mobile, 5-tab navigation (`M3NavigationBar`), database-backed Home Dashboard, Document Vault + custom categories, private S3/signed-local storage with magic-byte verification & audit logs, and real Android Camera Document Scanner (multi-page capture, rotate/crop, on-device PDF generation).
- **Day 4 (Completed)**: Tasks, Life Calendar (Month/Week/Agenda), BullMQ-queued Reminders, Assets & Warranty Repairs (with linked Vault invoices), Subscriptions with monthly/annual spend summaries, and Notification Center & privacy-masking preferences.
- **Day 5 (Next)**: Life Intelligence OCR/AI extraction verification, Expo SQLite offline sync, Universal Search, and Life AI Assistant.

See [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) and [docs/IMPLEMENTATION_CHECKLIST.md](docs/IMPLEMENTATION_CHECKLIST.md) for detailed progress.
