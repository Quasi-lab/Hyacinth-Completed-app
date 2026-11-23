import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { analyzeFinals, manilaDate } from './finals';

test('Manila reporting preserves date-only values and rolls timestamps into the local day', () => {
  assert.equal(manilaDate('2026-08-01'), '2026-08-01');
  assert.equal(manilaDate('2026-07-31T16:00:00Z'), '2026-08-01');
  assert.equal(manilaDate('2026-07-31T15:59:59Z'), '2026-07-31');
});

test('Finals selects cohorts by primary key and reports later admissions independently', () => {
  const admission = { admission: '2026-07-31T16:00:00Z', patientID: 1, doctorID: 2, nurseID: 3, roomID: 301, billID: 4 };
  const result = analyzeFinals({
    patientRecords: [
      { ...admission, recordID: 1505, patientID: 99 },
      { ...admission, recordID: -5000 },
      { ...admission, recordID: 1504 },
    ],
    bills: [{ billID: 4, purchasedAt: null, productName: 'Consultation', financialCost: 100, details: null }],
    doctors: [{ doctorID: 2, firstName: 'Test', lastName: 'Doctor' }],
    nurses: [{ nurseID: 3, firstName: 'Test', lastName: 'Nurse' }],
    rooms: [{ roomId: 301 }],
    patients: [{ patientID: 1 }],
  }, 0);
  assert.equal(result.before.facts, 1);
  assert.equal(result.batchCount, 1);
  assert.equal(result.after.facts, 2);
  assert.equal(result.totalFacts, 3);
  assert.equal(result.otherFacts, 1);
  assert.equal(result.growth, 1);
  assert.deepEqual(result.integrity, { missingReferences: 1, duplicateIds: 0 });
  assert.equal(result.after.scenarios.admissions[0].value, 2);
});

test('Finals follows the Supabase row cap and rejects an incomplete warehouse read', async t => {
  const projectUrl = 'https://warehouse.test';
  const originalUrl = process.env.VITE_SUPABASE_URL;
  const originalKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  process.env.VITE_SUPABASE_URL = projectUrl;
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
  t.after(() => {
    if (originalUrl === undefined) delete process.env.VITE_SUPABASE_URL;
    else process.env.VITE_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    else process.env.VITE_SUPABASE_PUBLISHABLE_KEY = originalKey;
  });
  const { app } = await import('./api/[[...path]].ts');
  const ids = Array.from({ length: 6504 }, (_, index) => index < 5000 ? index - 5000 : index - 4999);
  const factCursors: string[] = [];
  let incomplete = false;
  const realFetch = globalThis.fetch;
  t.mock.method(globalThis, 'fetch', (input: string, init?: RequestInit) => {
    const url = new URL(input);
    if (url.origin !== projectUrl) return realFetch(input, init);
    const exact = new Headers(init?.headers).get('Prefer') === 'count=exact';
    if (!url.pathname.endsWith('/PatientRecords')) {
      return Promise.resolve(Response.json([], { headers: { 'Content-Range': '*/0' } }));
    }
    const filter = url.searchParams.get('recordID');
    factCursors.push(filter ?? 'first');
    assert.equal(url.searchParams.get('order'), 'recordID.asc');
    assert.equal(exact, filter === null);
    const cursor = filter === null ? -Infinity : Number(filter.slice(3));
    const page = incomplete && filter ? [] : ids.filter(id => id > cursor).slice(0, 1000);
    const rows = page.map(recordID => ({ recordID, admission: null }));
    return Promise.resolve(Response.json(rows, {
      status: exact ? 206 : 200,
      headers: exact ? { 'Content-Range': '0-999/6504' } : {},
    }));
  });
  const server = app.listen(0, '127.0.0.1');
  t.after(() => server.close());
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const endpoint = `http://127.0.0.1:${address.port}/api/finals`;
  const complete = await fetch(endpoint);
  assert.equal(complete.status, 200);
  const result = await complete.json();
  assert.equal(result.before.facts, 1504);
  assert.equal(result.batchCount, 5000);
  assert.equal(result.totalFacts, 6504);
  assert.deepEqual(factCursors, ['first', 'gt.-4001', 'gt.-3001', 'gt.-2001', 'gt.-1001', 'gt.-1', 'gt.1000']);

  incomplete = true;
  const failed = await fetch(endpoint);
  assert.equal(failed.status, 503);
  assert.match((await failed.json()).error, /incomplete data during synchronization/);
});
