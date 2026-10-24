/**
 * Backend security regression tests (PDF §6, Phase 5 — Step 5).
 *
 * Verifies over HTTP:
 * - no modification/deletion path is open: update & delete are refused for
 *   anonymous callers, NON-owners AND owners alike at the permission layer
 *   (the authenticated role carries no update/delete — defense in depth —
 *   while the controllers additionally enforce an owner-only rule);
 * - bad login attempts fail without leaking a token;
 * - serialized API payloads never expose private user fields;
 * - the rendered frontend pages never leak a JWT.
 */

import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { api, login, validDiscussionInput } from './helpers.mjs';

const f = {};

before(async () => {
  f.marie = await login('demo_marie');
  f.paul = await login('demo_paul');

  const mine = await api('/api/discussions', {
    method: 'POST',
    jwt: f.marie.jwt,
    body: await validDiscussionInput(),
  });
  assert.equal(mine.status, 201);
  f.mineId = mine.json?.data?.documentId;
});

/* ---------------------- no open modification / deletion ------------------- */

test('anonymous modification of a discussion is refused (403)', async () => {
  const res = await api(`/api/discussions/${f.mineId}`, { method: 'PUT', body: { data: { title: '[PH5TEST] Hack' } } });
  assert.equal(res.status, 403);
});

test('anonymous deletion of a discussion is refused (403)', async () => {
  const res = await api(`/api/discussions/${f.mineId}`, { method: 'DELETE' });
  assert.equal(res.status, 403);
});

test("a member cannot modify another member's discussion (403)", async () => {
  const res = await api(`/api/discussions/${f.mineId}`, {
    method: 'PUT',
    jwt: f.paul.jwt, // non-owner
    body: { data: { title: '[PH5TEST] Usurpation' } },
  });
  assert.equal(res.status, 403);
});

test("a member cannot delete another member's discussion (403)", async () => {
  const res = await api(`/api/discussions/${f.mineId}`, { method: 'DELETE', jwt: f.paul.jwt });
  assert.equal(res.status, 403);
});

test('even the owner cannot modify/delete through the API (permission layer closed)', async () => {
  const put = await api(`/api/discussions/${f.mineId}`, {
    method: 'PUT',
    jwt: f.marie.jwt,
    body: { data: { title: '[PH5TEST] Owner edit' } },
  });
  const del = await api(`/api/discussions/${f.mineId}`, { method: 'DELETE', jwt: f.marie.jwt });
  assert.equal(put.status, 403, 'owner update is blocked by the permission layer (defense in depth)');
  assert.equal(del.status, 403, 'owner delete is blocked by the permission layer (defense in depth)');
});

/* ------------------------- authentication hardening ----------------------- */

test('a wrong password grants no token', async () => {
  const res = await api('/api/auth/local', {
    method: 'POST',
    body: { identifier: 'demo_marie', password: 'definitely-not-the-password' },
  });
  assert.equal(res.status, 400);
  assert.equal(res.json?.jwt, undefined);
  assert.ok(!res.headers.get('set-cookie'), 'credentials endpoint must not set a session cookie');
});

/* --------------------------- no private data leakage ---------------------- */

test('API payloads never expose private user fields (email/provider/password)', async () => {
  const banned = ['email', 'provider', 'password', 'resetPasswordToken', 'confirmationToken'];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (banned.includes(key)) assert.fail(`private field "${key}" leaked in API payload`);
        walk(value);
      }
    }
  };
  const list = await api('/api/discussions', { jwt: f.marie.jwt });
  assert.equal(list.status, 200);
  walk(list.json);

  const me = await api('/api/users/me', { jwt: f.marie.jwt });
  assert.equal(me.status, 200);
  assert.equal(me.json?.password, undefined, 'users/me must not return the password');
});

/* --------------------------- no JWT in rendered pages --------------------- */

test('the rendered frontend home page contains no JWT material', async () => {
  const res = await fetch('http://localhost:3000/', { signal: AbortSignal.timeout(20_000) });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(!html.includes('eyJ'), 'HTML must not embed a JWT');
  assert.ok(!html.includes('lr_strapi_jwt'), 'HTML must not reference the session cookie');
});
