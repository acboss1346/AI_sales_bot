import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  Key,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { fetchSystemStatus, fetchProductConfig } from '../services/api.js';

export default function Settings() {
  const [status, setStatus] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [statusResult, productResult] = await Promise.allSettled([
        fetchSystemStatus(),
        fetchProductConfig()
      ]);
      if (statusResult.status === 'fulfilled') setStatus(statusResult.value);
      if (productResult.status === 'fulfilled') setProduct(productResult.value);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3 min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-gray-400">Inspecting system configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-400" />
            <span>Settings & API Configuration</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Realtime credentials status, Supabase connection, and SalesFlow AI product knowledge.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-xs font-medium transition self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Test Live Connection</span>
        </button>
      </div>

      {/* Live System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* OpenAI Card */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">OpenAI Realtime AI</h2>
            </div>
            {status?.openai?.configured ? (
              <span className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Configured</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Missing Key</span>
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Realtime Voice Model:</span>
              <span className="text-gray-200 font-mono">{status?.openai?.realtimeModel}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Summary Model:</span>
              <span className="text-gray-200 font-mono">{status?.openai?.summaryModel}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Voice Character:</span>
              <span className="text-gray-200 font-mono capitalize">{status?.openai?.voice}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Key Prefix:</span>
              <span className="text-gray-200 font-mono">{status?.openai?.keyPrefix || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Supabase Database & Storage Card */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Database & Storage</h2>
            </div>
            {status?.supabase?.configured ? (
              <span className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Supabase Live</span>
              </span>
            ) : status?.supabase?.type === 'supabase' && status?.supabase?.connected === false ? (
              <span className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Supabase Offline (Local Fallback)</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                <span>Local Fallback</span>
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Active Storage Engine:</span>
              <span className="text-gray-200 font-semibold capitalize">
                {status?.supabase?.configured ? 'Supabase Cloud PostgreSQL' : 'Local File JSON / FS'}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Storage Bucket:</span>
              <span className="text-gray-200 font-mono">call-recordings</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Persistence State:</span>
              <span className="text-emerald-400 font-semibold">Active & Persistent</span>
            </div>
          </div>
        </div>

        {/* Server & Environment Card */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Server className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Server Health</h2>
            </div>
            <span className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Backend Port:</span>
              <span className="text-gray-200 font-mono">5001</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>WebRTC Protocol:</span>
              <span className="text-gray-200 font-mono">Direct Browser ↔ OpenAI</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Environment:</span>
              <span className="text-gray-200 font-mono uppercase">{status?.environment}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Guide Accordion / Panel */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white">Environment Configuration Guide</h2>
          <p className="text-xs text-gray-400 mt-1">
            To connect your live OpenAI account and cloud Supabase database, copy these values to your <code className="text-indigo-300">.env</code> file.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 font-mono text-xs text-gray-300 space-y-1 relative">
            <button
              onClick={() => handleCopy(`OPENAI_API_KEY=your_key_here\nOPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17\nOPENAI_SUMMARY_MODEL=gpt-4o-mini\nSUPABASE_URL=https://your-project.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=your_service_role_key\nSUPABASE_STORAGE_BUCKET=call-recordings\nPORT=5001`, 'env')}
              className="absolute right-3 top-3 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
              title="Copy snippet"
            >
              {copiedKey === 'env' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <p className="text-indigo-400 font-bold"># OpenAI Credentials (Required for Live Voice & Summary)</p>
            <p>OPENAI_API_KEY=sk-proj-...</p>
            <p>OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17</p>
            <p>OPENAI_SUMMARY_MODEL=gpt-4o-mini</p>
            <br />
            <p className="text-emerald-400 font-bold"># Supabase Credentials (Optional for local review; required for cloud production)</p>
            <p>SUPABASE_URL=https://[project-ref].supabase.co</p>
            <p>SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...</p>
            <p>SUPABASE_STORAGE_BUCKET=call-recordings</p>
            <br />
            <p className="text-gray-400 font-bold"># Server Port</p>
            <p>PORT=5001</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-400">
            <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-800 space-y-2">
              <h3 className="font-bold text-gray-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>1. Getting OpenAI Realtime Key</span>
              </h3>
              <p>
                Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-indigo-400 underline">OpenAI API Keys</a> and create a secret key with model permissions for Realtime and Chat models.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-800 space-y-2">
              <h3 className="font-bold text-gray-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>2. Supabase SQL & Storage Setup</span>
              </h3>
              <p>
                Run the SQL script located in <code className="text-emerald-300">supabase/migrations/01_initial_schema.sql</code> in your Supabase SQL Editor and create the <code className="text-emerald-300">call-recordings</code> storage bucket.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Centralized Product Knowledge Inspector */}
      {product && (
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Centralized Product Configuration</h2>
              <p className="text-xs text-gray-400">Approved product facts and sales pitch used by the AI voice agent</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.pricingPlans?.map((plan, idx) => (
              <div key={idx} className="bg-gray-800/50 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                  {plan.popular && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-lg font-black text-indigo-400">{plan.price}</p>
                <p className="text-[11px] text-gray-400">{plan.idealFor}</p>
                <ul className="space-y-1 text-xs text-gray-300">
                  {plan.features?.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
