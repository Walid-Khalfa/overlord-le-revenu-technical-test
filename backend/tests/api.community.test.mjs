/**
 * Backend API tests — community contract (PDF §6.1/§6.2/§6.3, Phase 5).
 *
 * Coverage:
 * - discussion validation: required fields, title min/max lengths, type,
 *   invalid category reference, unknown document (display path);
 * - refusal of unauthenticated publication (403) for discussions & replies;
 * - author attribution & usurpation protection: the server always derives
 *   the author from the JWT — a client-supplied `author` is ignored;
 * - reply validation and its attachment to the right discussion.
 *
 * Fixtures are `[PH5TEST]`-prefixed; clean them with `tests/cleanup-ph5.sql`.
 */

import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import {
  api,
  FIXTURE_PREFIX,
  login,
  fieldErrorsOf,
  someCategoryRef,
  validDiscussionInput,
  validReplyInput,
} from './helpers.mjs';

const fixtures = {};

before(async () => {
  fixtures.marie = await login('demo_marie'); // { jwt, user }
  fixtures.paul = await login('demo_paul');

  // Main fixture discussion, owned by demo_marie.
  const created = await api('/api/discussions', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: await validDiscussionInput(),
  });
  assert.equal(created.status, 201, `fixture discussion creation failed: ${created.status}`);
  fixtures.discussionId = created.json?.data?.documentId;
  assert.ok(fixtures.discussionId, 'fixture discussion has no documentId');
});

/* --------------------------- unauthenticated public ----------------------- */

test('unauthenticated publication of a discussion is refused (403)', async () => {
  const res = await api('/api/discussions', { method: 'POST', body: await validDiscussionInput() });
  assert.equal(res.status, 403);
  assert.match(res.json?.error?.name ?? '', /Forbidden|PolicyError/);
});

test('unauthenticated publication of a reply is refused (403)', async () => {
  const res = await api('/api/replies', {
    method: 'POST',
    body: validReplyInput(fixtures.discussionId),
  });
  assert.equal(res.status, 403);
  assert.match(res.json?.error?.name ?? '', /Forbidden|PolicyError/);
});

/* ------------------------------ discussion validation --------------------- */

test('creation without any field is rejected with per-field errors', async () => {
  const res = await api('/api/discussions', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: { data: {} },
  });
  assert.equal(res.status, 400);
  const errors = fieldErrorsOf(res.json);
  assert.ok('title' in errors, `title: ${JSON.stringify(errors)}`);
  assert.ok('content' in errors);
  assert.ok('category' in errors);
});

test('title shorter than 10 characters is rejected', async () => {
  const res = await api('/api/discussions', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: { data: { ...(await validDiscussionInput()).data, title: 'Tropcourt' } }, // 9 chars
  });
  assert.equal(res.status, 400);
  assert.ok('title' in fieldErrorsOf(res.json));
});

test('title longer than 150 characters is rejected', async () => {
  const res = await api('/api/discussions', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: { data: { ...(await validDiscussionInput()).data, title: `${FIXTURE_PREFIX}T`.repeat(151) } },
  });
  assert.equal(res.status, 400);
  assert.ok('title' in fieldErrorsOf(res.json));
});

test('a 10-character title is accepted (lower bound)', async () => {
  const res = await api('/api/discussions', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: await validDiscussionInput({ title: `${FIXTURE_PREFIX}[10char]` }),
  });
  assert.equal(res.status, 201);
  assert.ok(res.json?.data?.documentId);
});

test('invalid type is rejected', async () => {
  const res = await api('/api/discussions', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: { data: { ...(await validDiscussionInput()).data, type: 'poll' } },
  });
  assert.equal(res.status, 400);
  assert.ok('type' in fieldErrorsOf(res.json));
});

test('unknown category reference is rejected', async () => {
  const res = await api('/api/discussions', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: { data: { ...(await validDiscussionInput()).data, category: 'not-a-real-category' } },
  });
  assert.equal(res.status, 400);
  assert.ok('category' in fieldErrorsOf(res.json));
});

test('unknown document answers 404 (display path integrity)', async () => {
  const res = await api('/api/discussions/definitely-not-a-real-documentid', { jwt: fixtures.marie.jwt });
  assert.equal(res.status, 404);
});

/* ----------------------- author attribution & usurpation ------------------ */

test('server ignores a client-supplied author and keeps the JWT user', async () => {
  const paulId = fixtures.paul.user.id;
  const res = await api('/api/discussions', {
    method: 'POST',
    jwt: fixtures.marie.jwt, // marie is logged in…
    body: await validDiscussionInput({ author: paulId }), // …but tries to publish as paul
  });
  assert.equal(res.status, 201);
  assert.equal(res.json?.data?.author?.username, 'demo_marie', 'author must be the JWT user');
  assert.notEqual(res.json?.data?.author?.id, paulId);
});

/* --------------------------------- replies -------------------------------- */

test('reply shorter than 2 characters is rejected', async () => {
  const res = await api('/api/replies', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: { data: { content: 'x', discussion: fixtures.discussionId } },
  });
  assert.equal(res.status, 400);
  assert.ok('content' in fieldErrorsOf(res.json));
});

test('reply without a discussion reference is rejected', async () => {
  const res = await api('/api/replies', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: { data: { content: `${FIXTURE_PREFIX} Sans reference.` } },
  });
  assert.equal(res.status, 400);
  assert.ok('discussion' in fieldErrorsOf(res.json));
});

test('reply pointing at an unknown discussion is rejected', async () => {
  const res = await api('/api/replies', {
    method: 'POST',
    jwt: fixtures.marie.jwt,
    body: { data: { content: `${FIXTURE_PREFIX} Reference inconnue.`, discussion: 'unknown-doc-id' } },
  });
  assert.equal(res.status, 400);
  assert.ok('discussion' in fieldErrorsOf(res.json));
});

test('valid reply is created on the right discussion, attributed to the JWT user', async () => {
  const res = await api('/api/replies', {
    method: 'POST',
    jwt: fixtures.paul.jwt,
    body: validReplyInput(fixtures.discussionId),
  });
  assert.equal(res.status, 201);
  const reply = res.json?.data;
  assert.ok(reply?.documentId, 'created reply has a documentId');
  assert.equal(reply?.author?.username, 'demo_paul');

  fixtures.replyId = reply.documentId;
});

test('the reply is displayed inside its discussion (association)', async () => {
  const res = await api(`/api/discussions/${fixtures.discussionId}`, { jwt: fixtures.marie.jwt });
  assert.equal(res.status, 200);
  const replies = res.json?.data?.replies ?? [];
  assert.equal(replies[replies.length - 1]?.documentId, fixtures.replyId);
});
