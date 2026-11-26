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

## Design System — Warm Minimal × Editorial

- **Canvas**: `#F7F8F5` (primary), `#F1F2EC` (secondary)
- **Surfaces**: `#FFFFFF` (primary card), `#EEF1EA` (secondary surface)
- **Brand**: `#253A32` (deep forest), `#526F60` (secondary forest), `#A5BDA8` (sage), `#E6EEE7` (soft sage)
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

- **Day 1 (Completed)**: Monorepo setup, shared TypeScript packages, Warm Minimal × Editorial design tokens & mobile UI primitives, Expo Router foundation, Express API skeleton (`/api/v1/health`, OpenAPI spec), BullMQ worker skeleton, architecture & planning docs.
- **Day 2 (Next)**: PostgreSQL + Prisma schema, migrations, authentication, refresh-token rotation, and mobile auth integration.
- **Day 3–5 (Planned)**: Document Vault & S3 storage, Life Administration modules, Life Intelligence OCR/AI pipeline, and offline SQLite sync.

See [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) and [docs/IMPLEMENTATION_CHECKLIST.md](docs/IMPLEMENTATION_CHECKLIST.md) for detailed progress.
