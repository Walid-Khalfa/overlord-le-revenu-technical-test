import { defineConfig } from '@playwright/test';

/**
 * Playwright E2E configuration (Phase 5 — PDF §6).
 *
 * Preconditions: the full stack is already running locally —
 *   Next.js dev :3000 · Strapi :1337 · PostgreSQL :5432
 * The journeys run sequentially (one worker): they share the same live
 * database and must not race each other.
 */
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
});
