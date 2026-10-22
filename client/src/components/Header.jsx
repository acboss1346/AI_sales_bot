import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, ShieldCheck, Zap } from 'lucide-react';

export default function Header({ title, subtitle, systemStatus }) {
  return (
    <header className="h-20 border-b border-gray-800/80 bg-[#0B0F19]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* Consent/Security badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Realtime WebRTC • Ephemeral Auth</span>
        </div>

        {/* Quick Launch Call Button */}
        <Link
          to="/call"
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Start AI Call</span>
        </Link>
      </div>
    </header>
  );
}
