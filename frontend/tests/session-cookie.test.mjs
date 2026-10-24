/**
 * Session-cookie Secure-flag resolver — regression tests (post-audit fix).
 *
 * Locks in the three contract branches:
 *   1. HTTP request (the localhost demo)        → Secure omitted
 *   2. HTTPS request (production, x-forwarded-proto) → Secure set
 *   3. COOKIE_SECURE=true env override          → Secure set regardless
 *
 * Zero dependencies — Node built-in test runner.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCookieSecure } from '../lib/cookie-secure.ts';

test('plain http request (no forwarded proto, no env override) omits Secure', () => {
  const saved = process.env.COOKIE_SECURE;
  delete process.env.COOKIE_SECURE;
  try {
    assert.equal(resolveCookieSecure(null, false), false);
    assert.equal(resolveCookieSecure(undefined, false), false);
    assert.equal(resolveCookieSecure('http', false), false);
    assert.equal(resolveCookieSecure('http, https', false), false); // client-facing hop wins
  } finally {
    if (saved === undefined) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = saved;
  }
});

test('HTTPS request sets Secure automatically', () => {
  const saved = process.env.COOKIE_SECURE;
  delete process.env.COOKIE_SECURE;
  try {
    assert.equal(resolveCookieSecure('https', false), true);
    assert.equal(resolveCookieSecure('https', undefined), true);
    // multi-hop chains: first (client-facing) hop decides
    assert.equal(resolveCookieSecure('HTTPS', false), true);
    assert.equal(resolveCookieSecure('https,http', false), true); // trimmed first hop
  } finally {
    if (saved === undefined) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = saved;
  }
});

test('COOKIE_SECURE=true override wins in every branch', () => {
  assert.equal(resolveCookieSecure(null, true), true);
  assert.equal(resolveCookieSecure('http', true), true);
});

test('env fallback works when envSecure is not passed', () => {
  const saved = process.env.COOKIE_SECURE;
  try {
    delete process.env.COOKIE_SECURE;
    assert.equal(resolveCookieSecure(null), false);
    assert.equal(resolveCookieSecure('https'), true);
    process.env.COOKIE_SECURE = 'true';
    assert.equal(resolveCookieSecure(null), true);
    assert.equal(resolveCookieSecure('http'), true);
  } finally {
    if (saved === undefined) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = saved;
  }
});
