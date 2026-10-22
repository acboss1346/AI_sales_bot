const API_BASE = import.meta.env.VITE_API_URL || '';

async function handleResponse(res, fallbackMessage = 'Request failed') {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok || (data && data.success === false)) {
      throw new Error(data?.error?.message || data?.error || fallbackMessage);
    }
    return data;
  }
  const text = await res.text();
  throw new Error(`Server returned HTTP ${res.status}: ${text.slice(0, 120) || fallbackMessage}`);
}

export async function fetchRealtimeSession() {
  const res = await fetch(`${API_BASE}/api/realtime/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await handleResponse(res, 'Failed to initialize AI voice session');
  return data.data;
}

export async function createCallRecord({ started_at, recording_consent }) {
  const res = await fetch(`${API_BASE}/api/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ started_at, recording_consent })
  });
  const data = await handleResponse(res, 'Failed to create call record');
  return data.data;
}

export async function updateCallRecord(id, updates) {
  const res = await fetch(`${API_BASE}/api/calls/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  const data = await handleResponse(res, 'Failed to update call record');
  return data.data;
}

export async function finalizeCall(id, { transcript, ended_at, duration_seconds }) {
  const res = await fetch(`${API_BASE}/api/calls/${id}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, ended_at, duration_seconds })
  });
  const data = await handleResponse(res, 'Failed to finalize call');
  return data.data;
}

export async function uploadCallRecording(id, audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, `call_${id}.webm`);

  const res = await fetch(`${API_BASE}/api/calls/${id}/recording`, {
    method: 'POST',
    body: formData
  });
  const data = await handleResponse(res, 'Failed to upload call recording');
  return data.data;
}

export async function retryCallSummary(id) {
  const res = await fetch(`${API_BASE}/api/calls/${id}/retry-summary`, {
    method: 'POST'
  });
  const data = await handleResponse(res, 'Failed to retry summary generation');
  return data.data;
}

export async function fetchCalls({ page = 1, limit = 20, status = 'All', search = '', sortBy = 'newest' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    search,
    sortBy
  });
  const res = await fetch(`${API_BASE}/api/calls?${params.toString()}`);
  const data = await handleResponse(res, 'Failed to fetch calls');
  return data.data || data;
}

export async function fetchCallById(id) {
  const res = await fetch(`${API_BASE}/api/calls/${id}`);
  const data = await handleResponse(res, 'Call record not found');
  return data.data;
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/api/analytics`);
  const data = await handleResponse(res, 'Failed to fetch analytics');
  return data.data;
}

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/api/settings/status`);
  const data = await handleResponse(res, 'Failed to fetch system status');
  return data.data;
}

export async function fetchProductConfig() {
  const res = await fetch(`${API_BASE}/api/settings/product`);
  const data = await handleResponse(res, 'Failed to fetch product configuration');
  return data.data;
}
