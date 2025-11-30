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
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm transition-colors duration-300 ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-white/80 text-stone-600'}`}>
      <Clock size={16} className={isUrgent ? 'animate-pulse' : ''} />
      <span className="font-mono font-bold tabular-nums text-lg">
        {formatTime(secondsRemaining)}
      </span>
    </div>
  );
};