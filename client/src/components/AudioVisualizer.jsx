import React, { useEffect, useState } from 'react';

export default function AudioVisualizer({ isSpeaking, isCustomerSpeaking, isConnected }) {
  const [barHeights, setBarHeights] = useState(Array(18).fill(12));

  useEffect(() => {
    if (!isConnected) {
      setBarHeights(Array(18).fill(8));
      return;
    }

    const interval = setInterval(() => {
      setBarHeights(() => {
        return Array.from({ length: 18 }, (_, i) => {
          if (isSpeaking) {
            // AI speaking - vibrant violet/indigo waves
            const centerFactor = 1 - Math.abs(i - 9) / 9;
            return Math.floor(Math.random() * 45 * centerFactor) + 16;
          } else if (isCustomerSpeaking) {
            // Customer speaking - vibrant emerald waves
            const centerFactor = 1 - Math.abs(i - 9) / 9;
            return Math.floor(Math.random() * 40 * centerFactor) + 14;
          } else {
            // Listening / ambient gentle breathing wave
            return Math.floor(Math.sin(Date.now() / 300 + i * 0.4) * 6) + 10;
          }
        });
      });
    }, 70);

    return () => clearInterval(interval);
  }, [isSpeaking, isCustomerSpeaking, isConnected]);

  const activeColor = isSpeaking
    ? 'bg-indigo-500 shadow-indigo-500/50'
    : isCustomerSpeaking
    ? 'bg-emerald-500 shadow-emerald-500/50'
    : isConnected
    ? 'bg-gray-600'
    : 'bg-gray-800';

  return (
    <div className="flex items-center justify-center space-x-1.5 h-16 px-4 py-2 bg-gray-900/60 rounded-2xl border border-gray-800/80 backdrop-blur-sm">
      {barHeights.map((h, idx) => (
        <div
          key={idx}
          className={`w-1 rounded-full transition-all duration-75 ease-out shadow-sm ${activeColor}`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}
