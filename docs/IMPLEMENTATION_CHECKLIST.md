# LifeOS — Five-Day Implementation Checklist

Tasks are marked `[x]` only after implementation and verification.

## Day 1 — Project Foundation & Design System

- [x] Inspect existing workspace, Git status, branch (`main`), and `origin` remote
- [x] Initialize monorepo with npm workspaces (`apps/*`, `packages/*`)
- [x] Configure root TypeScript (`tsconfig.base.json`, `tsconfig.json`), ESLint, and Prettier
- [x] Create `@lifeos/shared-types`, `@lifeos/validation`, `@lifeos/config`, and `@lifeos/design-tokens`
- [x] Implement Warm Minimal × Editorial color palette, Manrope/Inter/DM Serif Display typography scale, spacing, radii, and dark theme semantic scaffold
- [x] Scaffold Express TypeScript modular monolith backend (`apps/api`) with `/api/v1/health`, `/api/v1/docs/openapi.json`, Pino logging, Zod validation middleware, error handler, and Supertest integration tests
- [x] Scaffold BullMQ worker foundation (`apps/worker`) with queue definitions and tests
- [x] Initialize React Native Expo SDK application (`apps/mobile`) with Expo Router and compatible packages
- [x] Implement mobile `ThemeProvider` and reusable editorial UI primitives (`Screen`, `EditorialText`, `Button`, `TextField`, `EditorialCard`, `SectionHeader`, `Badge`, `Divider`)
- [x] Verify mobile, API, worker typechecks, lint, build, and tests
- [x] Complete initial architecture documentation (`docs/architecture/ARCHITECTURE.md`, `docs/database/SCHEMA_OVERVIEW.md`, `docs/api/API_CONVENTIONS.md`, `README.md`)

## Day 2 — Authentication & Backend Foundation

- [x] Configure PostgreSQL & Prisma ORM
- [x] Create initial normalized Prisma schema and generate initial SQL migration (`0001_init/migration.sql`)
- [x] Implement Argon2id password hashing, registration, login, JWT access tokens, and refresh-token rotation
- [x] Implement device session tracking, logout, and ownership auth middleware
- [x] Implement mobile auth screens (Welcome, Register, Login, Forgot/Reset Password, Onboarding) connected to `/api/v1/auth/*`
- [x] Implement SecureStore token persistence and Axios refresh interceptor
- [x] Add authentication integration and unit tests
- [ ] Run `prisma migrate deploy` & `prisma:seed` against local PostgreSQL once `apps/api/.env` `DATABASE_URL` is configured

## Day 3 — Home Dashboard & Document Vault

- [ ] Implement 5-tab Expo Router navigation (`Home`, `Vault`, `Calendar`, `Assets`, `Profile`)
- [ ] Build editorial Home dashboard backed by real database queries (loading, empty, error, populated states)
- [ ] Implement Document Vault (categories, custom categories, metadata, filtering, search, archive/restore/delete)
- [ ] Implement private S3-compatible upload/download presigned URLs with MIME/size validation and audit logs
- [ ] Implement real Android Document Scanner (Expo Camera, crop/rotate, multi-page capture, PDF generation)
- [ ] Add vault integration and mobile component tests

## Day 4 — Life Administration Features

- [ ] Implement Task Management (priorities, due dates, recurring, snooze, linked docs/events)
- [ ] Implement Life Calendar (monthly, weekly, agenda, time zones, recurring events)
- [ ] Implement Asset & Warranty Manager (repair history, linked invoices)
- [ ] Implement Subscription Manager (billing cycles, monthly/annual spend summaries, renewal reminders)
- [ ] Implement server-side BullMQ reminder scheduling & notification preferences
- [ ] Implement Home dashboard database aggregation & integration tests

## Day 5 — Life Intelligence, Offline-First & Quality Preparation

- [ ] Implement AI Provider abstraction (`classifyDocument`, `extractDocumentData`, `summarizeDocument`, `answerLifeQuestion`)
- [ ] Implement BullMQ OCR + AI classification + Zod-validated structured extraction pipeline
- [ ] Build Extraction Review screen requiring explicit user confirmation before creating events/reminders/assets
- [ ] Implement Expo SQLite local metadata cache and `sync_operations` outbox with optimistic concurrency checks
- [ ] Implement Life AI Assistant & PostgreSQL full-text / `pg_trgm` Universal Search
- [ ] Security audit, full test suite, EAS Android build configuration, and Day 5 milestone report
