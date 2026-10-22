import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  TrendingUp,
  Users,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { fetchAnalytics, fetchSystemStatus } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [analyticsData, statusData] = await Promise.all([
        fetchAnalytics(),
        fetchSystemStatus()
      ]);
      setAnalytics(analyticsData);
      setSystemStatus(statusData);
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading sales analytics...</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Calls Conducted',
      value: analytics?.totalCalls ?? 0,
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      label: 'Confirmed Conversions',
      value: analytics?.convertedLeads ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      label: 'Demo Requests',
      value: analytics?.demoRequests ?? 0,
      icon: CalendarCheck,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      label: 'Interested Prospects',
      value: analytics?.interestedLeads ?? 0,
      icon: Sparkles,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10 border-violet-500/20'
    },
    {
      label: 'Follow-ups Required',
      value: analytics?.followUpsRequired ?? 0,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Conversion Rate',
      value: `${analytics?.conversionRate || '0.0'}%`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner if OpenAI Key not set */}
      {systemStatus && !systemStatus.openai?.configured && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">OpenAI API Key Not Configured</p>
              <p className="text-xs text-amber-400/80">Add OPENAI_API_KEY to your environment or server .env file to enable live voice calling.</p>
            </div>
          </div>
          <Link
            to="/settings"
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-gray-900 font-bold hover:bg-amber-400 transition"
          >
            Setup in Settings
          </Link>
        </div>
      )}

      {/* Top Hero & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sales Performance Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time pipeline analytics for SalesFlow AI voice sales conversations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/call"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Start Voice Call</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-gray-700 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400">{card.label}</span>
                <div className={`p-2 rounded-xl border ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-black text-white tracking-tight">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Sales Pipeline Distribution & Recent Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Status Breakdown */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-1">Sales Status Breakdown</h2>
          <p className="text-xs text-gray-400 mb-5">Distribution of outcomes across all completed calls</p>

          <div className="space-y-4">
            {analytics?.statusDistribution?.map((item) => {
              const total = analytics.totalCalls || 1;
              const percentage = analytics.totalCalls > 0
                ? Math.round((item.count / total) * 100)
                : 0;

              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-300">{item.status}</span>
                    <span className="font-mono text-gray-400">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Highlights / Summaries */}
        <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Recent Conversation Summaries</h2>
                <p className="text-xs text-gray-400">Key customer feedback and requirements captured</p>
              </div>
              <Link
                to="/history"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(!analytics?.recentCalls || analytics.recentCalls.length === 0) ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
                  <PhoneCall className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-200">No calls conducted yet</h3>
                <p className="text-xs text-gray-400 max-w-sm mt-1">
                  Click below to start an interactive AI voice conversation. Transcripts and metrics will update here automatically.
                </p>
                <Link
                  to="/call"
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                >
                  Conduct First Call
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.recentCalls.map((call) => (
                  <Link
                    key={call.id}
                    to={`/history/${call.id}`}
                    className="block p-3.5 rounded-xl bg-gray-800/40 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <StatusBadge status={call.sales_status} size="sm" />
                      <span className="text-[11px] font-mono text-gray-400">
                        {new Date(call.started_at).toLocaleDateString()} • {call.duration_seconds || 0}s
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {call.summary || 'Summary pending or brief interaction.'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Calls Table */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recent Call History</h2>
            <p className="text-xs text-gray-400">Latest completed voice sessions</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Full History</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!analytics?.recentCalls || analytics.recentCalls.length === 0) ? (
          <div className="p-8 text-center text-xs text-gray-500">
            Database empty. No call logs to display.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800 font-medium">
                <tr>
                  <th className="py-3 px-6">Date & Time</th>
                  <th className="py-3 px-6">Duration</th>
                  <th className="py-3 px-6">Sales Outcome</th>
                  <th className="py-3 px-6">Interest Level</th>
                  <th className="py-3 px-6">Recording</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {analytics.recentCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3.5 px-6 font-mono text-gray-300">
                      {new Date(call.started_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-gray-400">
                      {Math.floor((call.duration_seconds || 0) / 60)}m {(call.duration_seconds || 0) % 60}s
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={call.sales_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        call.customer_interest === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                        call.customer_interest === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {call.customer_interest || 'Low'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {call.recording_url ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved</span>
                        </span>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/history/${call.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
