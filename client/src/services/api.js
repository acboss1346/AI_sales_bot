const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchRealtimeSession() {
  const res = await fetch(`${API_BASE}/api/realtime/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to initialize AI voice session');
  }
  return data.data;
}

export async function createCallRecord({ started_at, recording_consent }) {
  const res = await fetch(`${API_BASE}/api/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ started_at, recording_consent })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to create call record');
  }
  return data.data;
}

export async function updateCallRecord(id, updates) {
  const res = await fetch(`${API_BASE}/api/calls/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to update call record');
  }
  return data.data;
}

export async function finalizeCall(id, { transcript, ended_at, duration_seconds }) {
  const res = await fetch(`${API_BASE}/api/calls/${id}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, ended_at, duration_seconds })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to finalize call');
  }
  return data.data;
}

export async function uploadCallRecording(id, audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, `call_${id}.webm`);

  const res = await fetch(`${API_BASE}/api/calls/${id}/recording`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to upload call recording');
  }
  return data.data;
}

export async function retryCallSummary(id) {
  const res = await fetch(`${API_BASE}/api/calls/${id}/retry-summary`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to retry summary generation');
  }
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
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to fetch calls');
  }
  return data;
}

export async function fetchCallById(id) {
  const res = await fetch(`${API_BASE}/api/calls/${id}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Call record not found');
  }
  return data.data;
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/api/analytics`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to fetch analytics');
  }
  return data.data;
}

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/api/settings/status`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to fetch system status');
  }
  return data.data;
}

export async function fetchProductConfig() {
  const res = await fetch(`${API_BASE}/api/settings/product`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to fetch product configuration');
  }
  return data.data;
}
