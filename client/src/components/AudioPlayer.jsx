import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  AlertCircle
} from 'lucide-react';

export default function AudioPlayer({ src, title = 'Call Recording' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.warn('Audio playback error on source:', src);
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Playback failed:', err);
        setHasError(true);
      });
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!src) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-400 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <AlertCircle className="w-4 h-4 text-gray-500" />
        <span>No recording audio file was uploaded for this call.</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg backdrop-blur">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={cyclePlaybackRate}
            className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
            title="Cycle Playback Speed"
          >
            {playbackRate}x
          </button>
          <a
            href={src}
            download="call_recording.webm"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-indigo-400 p-1 transition"
            title="Download Audio"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/30 shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          className="text-gray-400 hover:text-white p-1 transition"
          title="Restart Audio"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Progress Bar & Timestamps */}
        <div className="flex-1 flex items-center space-x-2">
          <span className="text-xs font-mono text-gray-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition"
          />
          <span className="text-xs font-mono text-gray-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="text-gray-400 hover:text-white p-1 transition"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {hasError && (
        <p className="mt-2 text-xs text-rose-400 flex items-center space-x-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Unable to stream audio recording directly. You can use the download button to listen.</span>
        </p>
      )}
    </div>
  );
}
