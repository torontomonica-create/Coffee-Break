import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  secondsRemaining: number;
  onTimeUp: () => void;
}

export const Timer: React.FC<TimerProps> = ({ secondsRemaining, onTimeUp }) => {
  useEffect(() => {
    if (secondsRemaining <= 0) {
      onTimeUp();
    }
  }, [secondsRemaining, onTimeUp]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isUrgent = secondsRemaining < 30;

  return (
    <div className={`flex items-center space-x-2 px-5 py-2.5 rounded-full backdrop-blur-md shadow-sm transition-colors duration-300 ${isUrgent ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-white/90 text-primary border border-white'}`}>
      <Clock size={20} strokeWidth={2.5} className={isUrgent ? 'animate-pulse' : ''} />
      <span className="font-sans font-bold tabular-nums text-2xl tracking-tight">
        {formatTime(secondsRemaining)}
      </span>
    </div>
  );
};