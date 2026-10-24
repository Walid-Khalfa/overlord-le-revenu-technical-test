-- Phase 5 test-data cleanup (PDF §6.4 — documented teardown procedure).
--
-- Removes ONLY the rows created by the Phase 5 suites: backend tests mark
-- their rows with `[PH5TEST]` (stamp after the marker); Playwright journeys
-- with `[E2E-PH5-<stamp>]` (stamp inside the brackets — hence the prefix
-- `[E2E-PH5-` in the LIKE patterns). Seed data, demo users and the Phase 4
-- manually-verified rows are untouched, and the database is never reset.
--
-- Run from the repository root:
--   Get-Content backend/tests/cleanup-ph5.sql | docker compose exec -i postgres psql -U strapi -d le_revenu
--
-- Safe to re-run (idempotent: zero rows matched gives a no-op).

BEGIN;

-- Replies created by the tests (content starts with the marker).
DELETE FROM replies_author_lnk
 WHERE reply_id IN (SELECT id FROM replies WHERE content LIKE '[PH5TEST]%' OR content LIKE '[E2E-PH5-%');
DELETE FROM replies_discussion_lnk
 WHERE reply_id IN (SELECT id FROM replies WHERE content LIKE '[PH5TEST]%' OR content LIKE '[E2E-PH5-%');
DELETE FROM replies
 WHERE content LIKE '[PH5TEST]%' OR content LIKE '[E2E-PH5-%';

-- Discussions created by the tests (title starts with the marker).
DELETE FROM discussions_author_lnk
 WHERE discussion_id IN (SELECT id FROM discussions WHERE title LIKE '[PH5TEST]%' OR title LIKE '[E2E-PH5-%');
DELETE FROM discussions_category_lnk
 WHERE discussion_id IN (SELECT id FROM discussions WHERE title LIKE '[PH5TEST]%' OR title LIKE '[E2E-PH5-%');
DELETE FROM discussions
 WHERE title LIKE '[PH5TEST]%' OR title LIKE '[E2E-PH5-%';

COMMIT;
