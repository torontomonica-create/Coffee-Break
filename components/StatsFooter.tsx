import React from 'react';
import { Users, Coffee } from 'lucide-react';
import { CoffeeStats } from '../types';

interface StatsFooterProps {
  stats: CoffeeStats;
}

export const StatsFooter: React.FC<StatsFooterProps> = ({ stats }) => {
  return (
    <div className="w-full bg-primary text-white py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center max-w-2xl mx-auto text-base w-full font-medium">
        
        {/* Live Users */}
        <div className="flex items-center space-x-2.5 text-green-400 flex-shrink-0">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <Users size={18} strokeWidth={2.5} />
          <span className="whitespace-nowrap tracking-wide">{stats.totalUsers} online</span>
        </div>

        {/* Total Consumed */}
        <div className="flex items-center space-x-3 text-stone-300 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Coffee size={18} strokeWidth={2.5} />
            <span className="whitespace-nowrap">{stats.iced + stats.double + stats.cappuccino} cups</span>
          </div>
        </div>
      </div>
    </div>
  );
};