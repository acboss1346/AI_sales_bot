import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  PhoneCall,
  Clock,
  Calendar,
  Volume2,
  FileText,
  ChevronRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { fetchCalls } from '../services/api.js';
import StatusBadge, { STATUS_STYLES } from '../components/StatusBadge.jsx';

export default function CallHistory() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadCalls = async () => {
    setLoading(true);
    try {
      const data = await fetchCalls({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        search,
        sortBy
      });
      setCalls(data.calls || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 1
      }));
    } catch (err) {
      console.error('Error fetching call history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [statusFilter, sortBy, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadCalls();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Call History & Records</h1>
          <p className="text-xs text-gray-400 mt-1">
            Persisted call records, voice recordings, transcripts, and AI-generated sales classifications.
          </p>
        </div>

        <Link
          to="/call"
          className="self-start md:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
        >
          <PhoneCall className="w-4 h-4" />
          <span>New Voice Call</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transcript, summary, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-800/80 border border-gray-700/60 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="bg-gray-800/80 border border-gray-700/60 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="All">All Statuses</option>
              {Object.keys(STATUS_STYLES).map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="bg-gray-800/80 border border-gray-700/60 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <button
            onClick={loadCalls}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Calls List / Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-gray-400">Loading call records...</p>
        </div>
      ) : calls.length === 0 ? (
        <div className="py-20 bg-gray-900/40 border border-gray-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200">No calls found</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            {search || statusFilter !== 'All'
              ? 'No conversations match the current search and filter criteria.'
              : 'Conduct a live voice sales call to view its recording, transcript, and AI summary here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => (
            <div
              key={call.id}
              className="bg-gray-900/60 hover:bg-gray-850 border border-gray-800/80 hover:border-gray-700 rounded-2xl p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={call.sales_status} size="sm" />
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(call.started_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    {Math.floor((call.duration_seconds || 0) / 60)}m {(call.duration_seconds || 0) % 60}s
                  </span>
                  {call.recording_url && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Recording Available</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {call.summary || 'Summary pending or no dialogue recorded.'}
                </p>

                {call.status_reason && (
                  <p className="text-[11px] text-gray-500 italic">
                    Reason: {call.status_reason}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center space-x-3 shrink-0">
                <Link
                  to={`/history/${call.id}`}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-xs font-semibold text-gray-200 transition"
                >
                  <span>Review Call</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-800/80 text-xs text-gray-400">
          <span>
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total calls)
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
