# LifeOS — PostgreSQL Database Design Overview

PostgreSQL is the single source of truth for structured LifeOS records, managed via Prisma ORM with explicit migrations.

## Design Principles

1. **UUID Primary Keys**: All domain tables use UUIDv4/v7 primary keys.
2. **Temporal Precision**: `TIMESTAMPTZ` for all event/audit timestamps; `DATE` for calendar-only expiry/renewal dates.
3. **Monetary Precision**: `NUMERIC(12, 2)` for prices, premiums, and subscription amounts (never `FLOAT`/`DOUBLE`).
4. **No Binary Blobs in DB**: Document files live exclusively in private S3-compatible object storage; PostgreSQL stores object keys, hashes, MIME types, and sizes.
5. **Flexible Extraction Metadata**: `JSONB` stores confidence-scored, source-referenced extraction fields validated by Zod.
6. **Strict Ownership**: Every user-owned query is scoped by `user_id` derived from the verified JWT—never from client-supplied IDs.
7. **Full-Text & Fuzzy Search**: `tsvector` GIN indexes + `pg_trgm` trigram indexes power Universal Search.

## Core Tables (Planned for Day 2–4 Migrations)

| Domain                      | Tables                                                              |
| :-------------------------- | :------------------------------------------------------------------ |
| **Identity & Sessions**     | `users`, `user_profiles`, `devices`, `refresh_tokens`, `audit_logs` |
| **Document Vault & AI**     | `categories`, `documents`, `document_versions`, `extracted_data`    |
| **Assets & Warranties**     | `assets`, `asset_documents`, `asset_repairs`                        |
| **Life Administration**     | `events`, `reminders`, `tasks`, `subscriptions`, `transactions`     |
| **Notifications**           | `notifications`, `notification_preferences`                         |
| **Life AI Assistant**       | `ai_conversations`, `ai_messages`                                   |
| **Offline Synchronization** | `sync_operations`                                                   |
