import React from 'react';
import { Users, Coffee } from 'lucide-react';
import { CoffeeStats } from '../types';

interface StatsFooterProps {
  stats: CoffeeStats;
}

export const StatsFooter: React.FC<StatsFooterProps> = ({ stats }) => {
  return (
    <div className="w-full bg-stone-900/90 backdrop-blur-md text-stone-200 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center max-w-2xl mx-auto text-xs sm:text-sm w-full">
        
        {/* Live Users */}
        <div className="flex items-center space-x-1.5 text-green-400 flex-shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <Users size={14} />
          <span className="font-semibold whitespace-nowrap">{stats.totalUsers} on break</span>
        </div>

        {/* Total Consumed */}
        <div className="flex items-center space-x-3 text-stone-400 flex-shrink-0">
          <div className="flex items-center space-x-1">
            <Coffee size={14} />
            <span className="whitespace-nowrap">{stats.iced + stats.double + stats.cappuccino} cups today</span>
          </div>
        </div>
      </div>
    </div>
  );
};