import React from 'react';
import {
  CheckCircle2,
  Sparkles,
  Calendar,
  Clock,
  XCircle,
  HelpCircle
} from 'lucide-react';

export const STATUS_STYLES = {
  'Converted': {
    bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    icon: CheckCircle2,
    label: 'Converted',
    dot: 'bg-emerald-400'
  },
  'Demo Requested': {
    bg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
    icon: Calendar,
    label: 'Demo Requested',
    dot: 'bg-indigo-400'
  },
  'Interested': {
    bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    icon: Sparkles,
    label: 'Interested',
    dot: 'bg-blue-400'
  },
  'Follow-up Required': {
    bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    icon: Clock,
    label: 'Follow-up Required',
    dot: 'bg-amber-400'
  },
  'Not Interested': {
    bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    icon: XCircle,
    label: 'Not Interested',
    dot: 'bg-rose-400'
  },
  'No Response': {
    bg: 'bg-gray-500/15 border-gray-500/30 text-gray-400',
    icon: HelpCircle,
    label: 'No Response',
    dot: 'bg-gray-400'
  }
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_STYLES[status] || STATUS_STYLES['No Response'];
  const Icon = config.icon;

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 space-x-1.5'
    : 'text-sm px-3 py-1 space-x-2';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{config.label}</span>
    </span>
  );
}
