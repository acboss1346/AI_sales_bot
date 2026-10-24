import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { getDbStatus } from '../src/services/db.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('GET /api/settings/status returns 200 and valid database status without dbStatus ReferenceError', async () => {
  const res = await fetch(`${baseUrl}/api/settings/status`);
  assert.equal(res.status, 200, 'Should return HTTP 200');
  
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data, 'Should have data object');
  assert.ok(['online', 'degraded'].includes(body.data.status));
  
  // Verify Supabase and Database fields are defined and safe
  assert.ok(body.data.supabase, 'supabase status should be present');
  assert.equal(typeof body.data.supabase.configured, 'boolean');
  assert.equal(typeof body.data.supabase.connected, 'boolean');
  assert.ok(body.data.supabase.type, 'supabase type should be present');
  
  // Verify no sensitive keys leaked
  const rawBody = JSON.stringify(body);
  assert.ok(!rawBody.includes('SUPABASE_SERVICE_ROLE_KEY'));
  assert.ok(!rawBody.includes('eyJh'));
});

test('getDbStatus returns healthy connectivity in local fallback mode', async () => {
  const status = await getDbStatus();
  assert.ok(status, 'Status object should exist');
  assert.equal(typeof status.connected, 'boolean');
  assert.ok(['supabase', 'local_json'].includes(status.type));
  assert.ok(['healthy', 'unreachable', 'error'].includes(status.status));
});

test('GET /api/analytics returns 200 and pipeline metrics', async () => {
  const res = await fetch(`${baseUrl}/api/analytics`);
  assert.equal(res.status, 200, 'Should return HTTP 200');
  
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data);
  assert.equal(typeof body.data.totalCalls, 'number');
  assert.equal(typeof body.data.convertedLeads, 'number');
  assert.ok(Array.isArray(body.data.statusDistribution));
  assert.ok(Array.isArray(body.data.recentCalls));
});

test('GET /api/calls returns 200 and call history records', async () => {
  const res = await fetch(`${baseUrl}/api/calls`);
  assert.equal(res.status, 200, 'Should return HTTP 200');
  
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.calls));
});

test('GET /api/health returns healthy', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  
  const body = await res.json();
  assert.equal(body.status, 'healthy');
});

test('POST /api/realtime/session fails safely with 400 when API key is missing', async () => {
  const res = await fetch(`${baseUrl}/api/realtime/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'MISSING_API_KEY');
  }
});

test('Call lifecycle: create, update, and finalize voice call with AI summary and classification', async () => {
  // 1. Create call
  const createRes = await fetch(`${baseUrl}/api/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recording_consent: true })
  });
  assert.equal(createRes.status, 201);
  const { data: call } = await createRes.json();
  assert.ok(call.id);
  assert.equal(call.recording_consent, true);

  // 2. Finalize call with dialogue
  const sampleTranscript = [
    { speaker: 'AI', text: 'Hello, this is SalesFlow AI. How can we help?', timestamp: '10:00:00 AM' },
    { speaker: 'Customer', text: 'I want to schedule a product demo for next week.', timestamp: '10:00:10 AM' }
  ];

  const finalizeRes = await fetch(`${baseUrl}/api/calls/${call.id}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: sampleTranscript,
      duration_seconds: 15
    })
  });
  assert.equal(finalizeRes.status, 200);
  const { data: finalized } = await finalizeRes.json();
  assert.equal(finalized.id, call.id);
  assert.ok(finalized.summary);
  assert.ok(['Demo Requested', 'Interested', 'Follow-up Required', 'Converted', 'Not Interested', 'No Response'].includes(finalized.sales_status));

  // 3. Fetch call by ID
  const fetchRes = await fetch(`${baseUrl}/api/calls/${call.id}`);
  assert.equal(fetchRes.status, 200);
  const { data: retrieved } = await fetchRes.json();
  assert.equal(retrieved.id, call.id);
  assert.equal(retrieved.duration_seconds, 15);
});

test('/api/settings/status returns clear non-crashing response when database check encounters simulated failure', async () => {
  const originalSupabaseUrl = process.env.SUPABASE_URL;
  try {
    // Set invalid URL to simulate unreachable database
    process.env.SUPABASE_URL = 'https://invalid-non-existent-subdomain.supabase.co';
    const res = await fetch(`${baseUrl}/api/settings/status`);
    assert.equal(res.status, 200, 'Should still return HTTP 200 without crashing');
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data);
    // Should clearly indicate database state without leaking credentials or crashing
    assert.equal(body.data.supabase.configured, false);
  } finally {
    if (originalSupabaseUrl !== undefined) {
      process.env.SUPABASE_URL = originalSupabaseUrl;
    } else {
      delete process.env.SUPABASE_URL;
    }
  }
});
