import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PhoneCall,
  History,
  Settings,
  Sparkles,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ systemStatus }) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/call', label: 'Live Voice Call', icon: PhoneCall, badge: 'Live' },
    { to: '/history', label: 'Call History', icon: History },
    { to: '/settings', label: 'Settings & Setup', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0F1422] border-r border-gray-800/80 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Logo */}
        <div className="p-6 border-b border-gray-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                SalesFlow <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">AI</span>
              </h1>
              <p className="text-[11px] text-gray-400 font-medium">Sankar Group Voice Bot</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{item.badge}</span>
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status Footprint */}
      <div className="p-4 border-t border-gray-800/60 m-3 rounded-2xl bg-gray-900/60 border border-gray-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            Backend Status
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between items-center text-gray-400">
            <span>OpenAI API:</span>
            <span className={systemStatus?.openai?.configured ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {systemStatus?.openai?.configured ? 'Ready' : 'Missing Key'}
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Database:</span>
            <span className="text-indigo-400 font-medium capitalize">
              {systemStatus?.supabase?.configured ? 'Supabase' : 'Local Fallback'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
