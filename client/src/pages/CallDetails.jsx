import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ListChecks,
  ListX,
  Target
} from 'lucide-react';
import { fetchCallById, retryCallSummary } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';

export default function CallDetails() {
  const { id } = useParams();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(null);

  const loadCall = async () => {
    setLoading(true);
    try {
      const data = await fetchCallById(id);
      setCall(data);
    } catch (err) {
      console.error('Error fetching call details:', err);
      setError(err.message || 'Call not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCall();
  }, [id]);

  const handleRetrySummary = async () => {
    setRetrying(true);
    try {
      const updated = await retryCallSummary(id);
      setCall(updated);
    } catch (err) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3 min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-gray-400">Loading call details...</p>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Call History</span>
        </Link>
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
          <p className="text-sm font-semibold">{error || 'Call record not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div className="space-y-1.5">
          <Link
            to="/history"
            className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Call History</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-black text-white tracking-tight">Call Review</h1>
            <span className="text-xs font-mono text-gray-500 px-2 py-0.5 rounded bg-gray-900 border border-gray-800">
              ID: {call.id}
            </span>
            <StatusBadge status={call.sales_status} />
          </div>
        </div>

        {/* Retry Button if needed */}
        <button
          onClick={handleRetrySummary}
          disabled={retrying}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700/60 text-xs font-medium transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Regenerating...' : 'Retry AI Classification'}</span>
        </button>
      </div>

      {/* Audio Recording Player (If available) */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Call Audio Recording</span>
          {call.recording_consent ? (
            <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Consented
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-gray-400 px-2 py-0.5 rounded bg-gray-800 border border-gray-700">
              No Consent
            </span>
          )}
        </h2>
        <AudioPlayer src={call.recording_url} title={`Dual-Audio Recording (${call.duration_seconds || 0}s)`} />
      </div>

      {/* AI Analysis Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Executive Summary Card (2 cols) */}
        <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">AI Sales Conversation Analysis</h2>
          </div>

          {/* Summary */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Conversation Summary
            </h3>
            <p className="text-sm text-gray-200 bg-gray-800/40 p-4 rounded-xl border border-gray-800 leading-relaxed">
              {call.summary || 'No summary available.'}
            </p>
          </div>

          {/* Status Reason Explanation */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Sales Classification Reason
            </h3>
            <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-800 text-xs text-gray-300 leading-relaxed">
              <span className="font-semibold text-indigo-400">Classified as {call.sales_status}: </span>
              {call.status_reason || 'Determined through conversation analysis.'}
            </div>
          </div>

          {/* Requirements & Objections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Requirements */}
            <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <span>Customer Requirements</span>
              </h4>
              {(!call.customer_requirements || call.customer_requirements.length === 0) ? (
                <p className="text-xs text-gray-500 italic">None specifically recorded</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {call.customer_requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Objections */}
            <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <ListX className="w-4 h-4 text-amber-400" />
                <span>Objections Raised</span>
              </h4>
              {(!call.objections || call.objections.length === 0) ? (
                <p className="text-xs text-gray-500 italic">No objections raised</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {call.objections.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps & Meta Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Recommended Next Steps Card */}
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Recommended Next Steps</span>
            </h3>

            {(!call.next_steps || call.next_steps.length === 0) ? (
              <p className="text-xs text-gray-500 italic">No next steps suggested</p>
            ) : (
              <div className="space-y-2">
                {call.next_steps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-800/40 border border-gray-800 text-xs text-gray-200 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Call Metadata Card */}
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Call Metadata
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-800/60">
                <span className="text-gray-400">Date:</span>
                <span className="text-gray-200 font-mono">
                  {new Date(call.started_at).toLocaleDateString([], { dateStyle: 'medium' })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800/60">
                <span className="text-gray-400">Duration:</span>
                <span className="text-gray-200 font-mono">
                  {Math.floor((call.duration_seconds || 0) / 60)}m {(call.duration_seconds || 0) % 60}s
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800/60">
                <span className="text-gray-400">Customer Interest:</span>
                <span className={`font-semibold ${
                  call.customer_interest === 'High' ? 'text-emerald-400' :
                  call.customer_interest === 'Medium' ? 'text-blue-400' :
                  'text-gray-400'
                }`}>
                  {call.customer_interest || 'Low'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Processing Status:</span>
                <span className="capitalize text-indigo-400 font-medium">
                  {call.processing_status || 'completed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Full Transcript Timeline */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Full Turn-by-Turn Transcript</h2>
            <p className="text-xs text-gray-400">Verbatim dialogue between customer and SalesFlow AI</p>
          </div>
          <span className="text-xs font-mono text-gray-400 px-2.5 py-1 rounded bg-gray-800">
            {call.transcript?.length || 0} turns recorded
          </span>
        </div>

        {(!call.transcript || call.transcript.length === 0) ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No dialogue was recorded for this call.
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {call.transcript.map((msg, idx) => {
              const isAi = msg.speaker === 'AI';
              return (
                <div
                  key={idx}
                  className={`flex items-start space-x-3 ${isAi ? '' : 'flex-row-reverse space-x-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAi ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div className="max-w-[80%] space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-gray-300">
                        {isAi ? 'SalesFlow AI' : 'Customer'}
                      </span>
                      {msg.timestamp && (
                        <span className="text-[10px] font-mono text-gray-500">
                          {msg.timestamp}
                        </span>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isAi
                          ? 'bg-gray-800/90 text-gray-100 border border-gray-700/50'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
