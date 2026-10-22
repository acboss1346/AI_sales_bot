import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Clock,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useRealtimeCall } from '../hooks/useRealtimeCall.js';
import AudioVisualizer from '../components/AudioVisualizer.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function LiveCall() {
  const {
    callStatus,
    callDuration,
    recordingConsent,
    setRecordingConsent,
    transcript,
    isAiSpeaking,
    isCustomerSpeaking,
    errorMessage,
    currentCallId,
    finalizedCall,
    isUploadingRecording,
    startCall,
    endCall
  } = useRealtimeCall();

  const chatContainerRef = useRef(null);

  // Auto-scroll chat smoothly on new message without blocking user manual scrolling
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCallActive = callStatus === 'connected' || callStatus === 'connecting' || callStatus === 'requesting_permissions';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Live AI Voice Sales Call</span>
            {callStatus === 'connected' && (
              <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>LIVE</span>
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Speak directly with the SalesFlow AI consultative voice agent using real-time WebRTC audio.
          </p>
        </div>

        {/* Live Timer Pill */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono text-gray-200 shadow-inner">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold tracking-wider">{formatTimer(callDuration)}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Voice Visualizer, Controls, Status (5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Main Visualizer & Voice Orb Card */}
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur">
            {/* Subtle radial background glow */}
            <div
              className={`absolute -inset-10 opacity-30 blur-3xl transition-all duration-700 pointer-events-none rounded-full ${
                isAiSpeaking
                  ? 'bg-indigo-600'
                  : isCustomerSpeaking
                  ? 'bg-emerald-500'
                  : callStatus === 'connected'
                  ? 'bg-blue-600'
                  : 'bg-transparent'
              }`}
            />

            {/* Glowing Voice Orb */}
            <div className="relative mb-6">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                  callStatus === 'connected'
                    ? isAiSpeaking
                      ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 scale-105 glow-purple ring-4 ring-indigo-500/30'
                      : isCustomerSpeaking
                      ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 scale-105 glow-emerald ring-4 ring-emerald-500/30'
                      : 'bg-gradient-to-tr from-gray-800 to-gray-700 ring-2 ring-gray-700'
                    : 'bg-gray-800/80 ring-1 ring-gray-700'
                }`}
              >
                {isAiSpeaking ? (
                  <Volume2 className="w-12 h-12 text-white animate-bounce" />
                ) : isCustomerSpeaking ? (
                  <Mic className="w-12 h-12 text-white animate-pulse" />
                ) : (
                  <Bot className="w-12 h-12 text-gray-300" />
                )}
              </div>

              {/* Status indicator badge */}
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <span
                  className={`text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md border ${
                    callStatus === 'connected'
                      ? isAiSpeaking
                        ? 'bg-indigo-500 text-white border-indigo-400'
                        : isCustomerSpeaking
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-gray-800 text-gray-300 border-gray-700'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {callStatus === 'connected'
                    ? isAiSpeaking
                      ? 'AI Speaking'
                      : isCustomerSpeaking
                      ? 'You are Speaking'
                      : 'AI Listening...'
                    : callStatus === 'requesting_permissions'
                    ? 'Requesting Mic...'
                    : callStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Call Offline'}
                </span>
              </div>
            </div>

            {/* Voice Activity Waveform Bars */}
            <div className="w-full mb-6">
              <AudioVisualizer
                isSpeaking={isAiSpeaking}
                isCustomerSpeaking={isCustomerSpeaking}
                isConnected={callStatus === 'connected'}
              />
            </div>

            {/* Call Controls Button: Start / End */}
            <div className="w-full space-y-3">
              {!isCallActive ? (
                <button
                  onClick={startCall}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <PhoneCall className="w-5 h-5 fill-current" />
                  <span>Start Live Voice Conversation</span>
                </button>
              ) : (
                <button
                  onClick={endCall}
                  disabled={callStatus === 'ending'}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>{callStatus === 'ending' ? 'Finalizing Call...' : 'End Conversation'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Recording Consent & AI Disclosure Card */}
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Audio Recording Consent</span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isCallActive}
                  checked={recordingConsent}
                  onChange={(e) => setRecordingConsent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              When enabled, both your microphone audio and the AI agent's responses are recorded locally and securely stored for playback and call review. You can disable this before initiating the call.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-rose-200">Connection Error</p>
                <p className="text-rose-300/90">{errorMessage}</p>
                {errorMessage.includes('API key') && (
                  <Link to="/settings" className="inline-block mt-2 font-semibold text-white underline">
                    Go to Settings to configure OpenAI Key →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Conversation Transcript (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-gray-900/60 border border-gray-800/80 rounded-3xl overflow-hidden backdrop-blur min-h-[550px]">
          {/* Transcript Header */}
          <div className="p-5 border-b border-gray-800/80 flex items-center justify-between bg-gray-900/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Live Conversation Transcript</h2>
                <p className="text-[11px] text-gray-400">Real-time Whisper transcription & AI speech</p>
              </div>
            </div>

            <span className="text-xs font-mono text-gray-400 px-2.5 py-1 rounded-lg bg-gray-800/80 border border-gray-700/50">
              {transcript.length} turns
            </span>
          </div>

          {/* Transcript Scroll Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[500px]"
          >
            {transcript.length === 0 ? (
              <div className="h-full py-20 flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-800/50 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-gray-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Waiting for conversation to begin</p>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Press "Start Live Voice Conversation" to connect. The AI will introduce itself and ask discovery questions.
                  </p>
                </div>
              </div>
            ) : (
              transcript.map((msg) => {
                const isAi = msg.speaker === 'AI';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${isAi ? '' : 'flex-row-reverse space-x-reverse'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isAi
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      }`}
                    >
                      {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Chat Bubble */}
                    <div className="max-w-[80%] space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-semibold text-gray-300">
                          {isAi ? 'SalesFlow AI Assistant' : 'You (Customer)'}
                        </span>
                        {msg.timestamp && (
                          <span className="text-[10px] font-mono text-gray-500">
                            {msg.timestamp}
                          </span>
                        )}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isAi
                            ? 'bg-gray-800/90 text-gray-100 rounded-tl-sm border border-gray-700/60'
                            : 'bg-indigo-600/90 text-white rounded-tr-sm border border-indigo-500/50'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Transcript Footer Info */}
          <div className="p-4 border-t border-gray-800/80 bg-gray-900/40 text-[11px] text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Full duplex speech: You can interrupt the AI at any time.</span>
            </span>
            <span className="text-gray-500 font-mono">English • Hindi • Hinglish</span>
          </div>
        </div>
      </div>

      {/* Post-Call Summary Modal / Card if Call Just Ended */}
      {finalizedCall && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-gray-900 to-[#0B0F19] border-2 border-indigo-500/40 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Call Completed & Evaluated</h2>
              </div>
              <p className="text-xs text-gray-400">
                AI summary and sales classification generated successfully.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <StatusBadge status={finalizedCall.sales_status} />
              <Link
                to={`/history/${finalizedCall.id}`}
                className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
              >
                <span>View Full Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Summary Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Executive Summary
                </h3>
                <p className="text-sm text-gray-200 bg-gray-800/40 p-3.5 rounded-xl border border-gray-800">
                  {finalizedCall.summary}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Status Reason
                </h3>
                <p className="text-xs text-gray-300 bg-gray-800/40 p-3 rounded-xl border border-gray-800">
                  {finalizedCall.status_reason}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Customer Interest
                </h3>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                  finalizedCall.customer_interest === 'High' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  finalizedCall.customer_interest === 'Medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {finalizedCall.customer_interest || 'Low'} Interest
                </span>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Recording Status
                </h3>
                {isUploadingRecording ? (
                  <span className="text-xs text-indigo-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading audio recording...</span>
                  </span>
                ) : finalizedCall.recording_url ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Audio recording saved and ready</span>
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Recording disabled or not persisted.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
