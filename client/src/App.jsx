import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LiveCall from './pages/LiveCall.jsx';
import CallHistory from './pages/CallHistory.jsx';
import CallDetails from './pages/CallDetails.jsx';
import Settings from './pages/Settings.jsx';
import { fetchSystemStatus } from './services/api.js';

function AppLayout() {
  const [systemStatus, setSystemStatus] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchSystemStatus()
      .then(setSystemStatus)
      .catch((err) => console.warn('Could not load status:', err.message));
  }, []);

  const getPageTitle = () => {
    if (location.pathname === '/') {
      return { title: 'Dashboard', subtitle: 'Overview of AI sales calls and pipeline conversion' };
    }
    if (location.pathname === '/call') {
      return { title: 'Live Voice Session', subtitle: 'Interactive WebRTC speech-to-speech call' };
    }
    if (location.pathname.startsWith('/history/')) {
      return { title: 'Call Details & Audit', subtitle: 'In-depth conversation review, recording, and AI analysis' };
    }
    if (location.pathname === '/history') {
      return { title: 'Call History', subtitle: 'All completed sales interactions and summaries' };
    }
    if (location.pathname === '/settings') {
      return { title: 'Settings & Credentials', subtitle: 'API keys, database health, and product guidelines' };
    }
    return { title: 'SalesFlow AI', subtitle: 'AI Voice Sales Agent' };
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19]">
      {/* Sidebar Navigation */}
      <Sidebar systemStatus={systemStatus} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header title={title} subtitle={subtitle} systemStatus={systemStatus} />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/call" element={<LiveCall />} />
            <Route path="/history" element={<CallHistory />} />
            <Route path="/history/:id" element={<CallDetails />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
