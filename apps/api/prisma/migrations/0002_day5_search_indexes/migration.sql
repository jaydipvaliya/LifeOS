-- Day 5: Enable pg_trgm for fast fuzzy/full-text Universal Search across documents, tasks, events, assets, and OCR text.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_filename_trgm ON documents USING gin (original_filename gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON tasks USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_assets_name_trgm ON assets USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_extracted_raw_text_trgm ON extracted_data USING gin (raw_text gin_trgm_ops);
