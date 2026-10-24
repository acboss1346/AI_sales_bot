import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const DATA_FILE = isVercel
  ? '/tmp/calls.json'
  : path.resolve(__dirname, '../../data/calls.json');

// Initialize local JSON storage if needed
function ensureLocalDataFile() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Could not ensure local data file:', err.message);
  }
}

function readLocalCalls() {
  try {
    ensureLocalDataFile();
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local calls store:', err.message);
    return [];
  }
}

function writeLocalCalls(calls) {
  try {
    ensureLocalDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(calls, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local calls store:', err.message);
  }
}

let supabaseClient = null;
let isSupabaseConfigured = false;

export function initDb() {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();

  const supabaseUrl = rawUrl?.replace(/^['"]|['"]$/g, '');
  const supabaseKey = rawKey?.replace(/^['"]|['"]$/g, '');

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });
      isSupabaseConfigured = true;
      console.log('✅ Supabase client initialized with URL:', supabaseUrl);
    } catch (err) {
      console.warn('⚠️ Failed to initialize Supabase client:', err.message);
      isSupabaseConfigured = false;
      supabaseClient = null;
    }
  } else {
    isSupabaseConfigured = false;
    supabaseClient = null;
  }
}

export async function getDbStatus() {
  const rawUrl = process.env.SUPABASE_URL?.trim()?.replace(/^['"]|['"]$/g, '');
  const isTargetingSupabase = Boolean(rawUrl && !rawUrl.includes('your-project-id'));

  if (!isSupabaseConfigured && isTargetingSupabase) {
    initDb();
  }

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase health check timed out')), 3000)
      );

      const pingPromise = supabaseClient
        .from('calls')
        .select('id', { head: true, count: 'exact' })
        .limit(1);

      const result = await Promise.race([pingPromise, timeoutPromise]);

      if (result.error) {
        console.warn('Supabase health check failed, falling back to local mode:', result.error.message);
        return {
          type: 'supabase',
          supabaseConfigured: true,
          connected: false,
          status: 'unreachable',
          error: 'Supabase service unreachable',
          url: rawUrl ? `${rawUrl.slice(0, 25)}...` : null
        };
      }

      return {
        type: 'supabase',
        supabaseConfigured: true,
        connected: true,
        status: 'healthy',
        url: rawUrl ? `${rawUrl.slice(0, 25)}...` : null
      };
    } catch (err) {
      console.warn('Supabase connectivity check exception:', err.message);
      return {
        type: 'supabase',
        supabaseConfigured: true,
        connected: false,
        status: 'unreachable',
        error: 'Supabase connection failed',
        url: rawUrl ? `${rawUrl.slice(0, 25)}...` : null
      };
    }
  }

  // Local JSON storage mode
  try {
    ensureLocalDataFile();
    const calls = readLocalCalls();
    return {
      type: 'local_json',
      supabaseConfigured: false,
      connected: true,
      status: 'healthy',
      totalCalls: calls.length,
      url: null
    };
  } catch (err) {
    console.warn('Local data file check error:', err.message);
    return {
      type: 'local_json',
      supabaseConfigured: false,
      connected: false,
      status: 'error',
      error: 'Local data store inoperable',
      url: null
    };
  }
}

export async function createCall({ started_at = new Date().toISOString(), recording_consent = false } = {}) {
  const newCall = {
    id: crypto.randomUUID(),
    started_at,
    ended_at: null,
    duration_seconds: 0,
    recording_consent: Boolean(recording_consent),
    recording_path: null,
    recording_url: null,
    transcript: [],
    summary: null,
    customer_requirements: [],
    objections: [],
    next_steps: [],
    customer_interest: null,
    sales_status: 'No Response',
    status_reason: null,
    processing_status: 'in_progress',
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('calls')
        .insert([newCall])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Supabase createCall error, falling back to local store:', err.message);
    }
  }

  // Local file fallback
  const calls = readLocalCalls();
  calls.unshift(newCall);
  writeLocalCalls(calls);
  return newCall;
}

export async function updateCall(id, updates = {}) {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Supabase updateCall error, falling back to local update:', err.message);
    }
  }

  // Local fallback
  const calls = readLocalCalls();
  const index = calls.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error(`Call with ID ${id} not found`);
  }

  calls[index] = { ...calls[index], ...updates };
  writeLocalCalls(calls);
  return calls[index];
}

export async function getCallById(id) {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('calls')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.error('Supabase getCallById error, trying local store:', err.message);
    }
  }

  const calls = readLocalCalls();
  return calls.find(c => c.id === id) || null;
}

export async function getCalls({ page = 1, limit = 20, status, search, sortBy = 'newest' } = {}) {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, parseInt(limit, 10));
  const from = (p - 1) * l;
  const to = from + l - 1;

  if (isSupabaseConfigured && supabaseClient) {
    try {
      let query = supabaseClient.from('calls').select('*', { count: 'exact' });

      if (status && status !== 'All') {
        query = query.eq('sales_status', status);
      }

      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(`summary.ilike.%${s}%,status_reason.ilike.%${s}%`);
      }

      query = query.order('started_at', { ascending: sortBy === 'oldest' });
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (!error) {
        return {
          calls: data || [],
          total: count || 0,
          page: p,
          limit: l,
          totalPages: Math.ceil((count || 0) / l)
        };
      }
      console.error('Supabase getCalls query error, falling back to local:', error.message);
    } catch (err) {
      console.error('Supabase getCalls error, falling back to local:', err.message);
    }
  }

  // Local fallback
  let calls = readLocalCalls();

  if (status && status !== 'All') {
    calls = calls.filter(c => c.sales_status === status);
  }

  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    calls = calls.filter(c => {
      const summaryMatch = c.summary && c.summary.toLowerCase().includes(s);
      const reasonMatch = c.status_reason && c.status_reason.toLowerCase().includes(s);
      const transcriptMatch = Array.isArray(c.transcript) && c.transcript.some(t => t.text?.toLowerCase().includes(s));
      return summaryMatch || reasonMatch || transcriptMatch;
    });
  }

  calls.sort((a, b) => {
    const dateA = new Date(a.started_at).getTime();
    const dateB = new Date(b.started_at).getTime();
    return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  const total = calls.length;
  const paginated = calls.slice(from, to + 1);

  return {
    calls: paginated,
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l)
  };
}

export async function getAnalytics() {
  if (!isSupabaseConfigured && process.env.SUPABASE_URL) {
    initDb();
  }
  let calls = [];

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('calls').select('*');
      if (!error && Array.isArray(data)) {
        calls = data;
      } else {
        calls = readLocalCalls();
      }
    } catch (err) {
      console.error('Supabase getAnalytics error, falling back to local:', err.message);
      calls = readLocalCalls();
    }
  } else {
    calls = readLocalCalls();
  }

  if (!Array.isArray(calls)) {
    calls = [];
  }

  const totalCalls = calls.length;
  const convertedLeads = calls.filter(c => c.sales_status === 'Converted').length;
  const interestedLeads = calls.filter(c => c.sales_status === 'Interested').length;
  const demoRequests = calls.filter(c => c.sales_status === 'Demo Requested').length;
  const followUpsRequired = calls.filter(c => c.sales_status === 'Follow-up Required').length;
  const notInterested = calls.filter(c => c.sales_status === 'Not Interested').length;
  const noResponse = calls.filter(c => c.sales_status === 'No Response').length;

  const conversionRate = totalCalls > 0 ? ((convertedLeads / totalCalls) * 100).toFixed(1) : '0.0';
  const interestRate = totalCalls > 0 ? (((convertedLeads + interestedLeads + demoRequests) / totalCalls) * 100).toFixed(1) : '0.0';

  // Status breakdown array for charts/distributions
  const statusDistribution = [
    { status: 'Converted', count: convertedLeads, color: '#10B981' },
    { status: 'Demo Requested', count: demoRequests, color: '#6366F1' },
    { status: 'Interested', count: interestedLeads, color: '#3B82F6' },
    { status: 'Follow-up Required', count: followUpsRequired, color: '#F59E0B' },
    { status: 'Not Interested', count: notInterested, color: '#EF4444' },
    { status: 'No Response', count: noResponse, color: '#6B7280' }
  ];

  // Recent 5 calls
  const recentCalls = [...calls]
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 5);

  return {
    totalCalls,
    convertedLeads,
    interestedLeads,
    demoRequests,
    followUpsRequired,
    notInterested,
    noResponse,
    conversionRate,
    interestRate,
    statusDistribution,
    recentCalls
  };
}
