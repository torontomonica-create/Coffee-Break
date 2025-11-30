import React, { useState, useEffect, useRef } from 'react';
import { CoffeeType } from '../types';
import { COFFEE_CONFIG, MAX_SIPS } from '../constants';

interface CoffeeCupProps {
  type: CoffeeType;
  sipsTaken: number;
  onSip: () => void;
}

export const CoffeeCup: React.FC<CoffeeCupProps> = ({ type, sipsTaken, onSip }) => {
  const config = COFFEE_CONFIG[type];
  const [isSipping, setIsSipping] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (sipsTaken > 0 && sipsTaken <= MAX_SIPS) {
      setIsSipping(true);
      const timer = setTimeout(() => setIsSipping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [sipsTaken]);

  const startSipping = (e: React.PointerEvent) => {
    // Prevent default behaviors like scrolling or selection
    e.preventDefault(); 
    
    // Immediate sip logic
    onSip();

    // Start continuous sipping
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      onSip();
    }, 150);
  };

  const stopSipping = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  
  // Calculate liquid height percentage.
  // Starts at 80% filled. 
  const remainingSips = MAX_SIPS - sipsTaken;
  const fillPercentage = (remainingSips / MAX_SIPS) * 80;

  // Ice cubes visualization
  const IceCubes = () => (
    <div className="absolute inset-0 pointer-events-none opacity-60">
      <div className="absolute top-[30%] left-[20%] w-8 h-8 bg-white/30 rotate-12 rounded-sm backdrop-blur-sm border border-white/20"></div>
      <div className="absolute top-[50%] right-[30%] w-6 h-6 bg-white/30 -rotate-12 rounded-sm backdrop-blur-sm border border-white/20"></div>
      <div className="absolute bottom-[30%] left-[40%] w-7 h-7 bg-white/30 rotate-45 rounded-sm backdrop-blur-sm border border-white/20"></div>
    </div>
  );

  // Steam visualization for hot coffee
  const Steam = () => (
    <div className="absolute -top-20 left-0 w-full h-16 pointer-events-none z-0 flex justify-center items-end space-x-4">
      <div className="w-4 h-10 bg-black/30 rounded-full blur-md animate-steam"></div>
      <div className="w-4 h-12 bg-black/30 rounded-full blur-md animate-steam" style={{ animationDelay: '0.5s' }}></div>
      <div className="w-4 h-8 bg-black/30 rounded-full blur-md animate-steam" style={{ animationDelay: '1s' }}></div>
    </div>
  );

  return (
    <div className="relative flex flex-col items-center justify-center h-auto w-full max-w-[320px] mx-auto select-none p-4">
      
      {/* Sip Instruction - Positioned above the cup to avoid being covered by chat */}
      <div className={`mb-6 text-stone-500 font-medium animate-pulse text-center w-full transition-opacity duration-500 ${remainingSips > 0 ? 'opacity-100' : 'opacity-0'}`}>
        Tap or Hold to Sip!
      </div>

      {/* Interactive Wrapper - handles click/hold and scale animation */}
      <div 
        onPointerDown={startSipping}
        onPointerUp={stopSipping}
        onPointerLeave={stopSipping}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative w-48 h-60 cursor-pointer transition-transform active:scale-95 active:rotate-1 ${isSipping ? 'animate-sip' : ''}`}
        style={{ touchAction: 'none' }}
      >
        {/* Steam for Hot Coffee - Rendered behind the cup but rising above */}
        {type !== CoffeeType.ICED_COFFEE && remainingSips > 0 && <Steam />}

        {/* Handle for non-iced coffee - Positioned outside the cup body */}
        {type !== CoffeeType.ICED_COFFEE && (
          <div className="absolute top-10 -right-7 w-9 h-24 border-4 border-l-0 border-stone-200 rounded-r-3xl bg-white/30 shadow-sm z-0"></div>
        )}

        {/* Straw for Iced Coffee - Sticking out the top with Liquid Animation */}
        {type === CoffeeType.ICED_COFFEE && (
          <div className="absolute -top-16 left-2/3 w-4 h-[125%] -translate-x-1/2 -rotate-[15deg] origin-bottom z-0">
             <div className="w-full h-full bg-white/20 backdrop-blur-[1px] rounded-t-sm border border-white/40 overflow-hidden relative shadow-sm">
                
                {/* Stripes */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,107,107,0.5)_10px,rgba(255,107,107,0.5)_16px)] z-20 pointer-events-none"></div>
                
                {/* Liquid in Straw */}
                <div 
                    className={`absolute bottom-0 left-0 w-full ${config.color} transition-all ${isSipping ? 'duration-200 ease-out' : 'duration-700 ease-in-out'} z-10`}
                    style={{ 
                        height: isSipping ? '100%' : `${fillPercentage * 0.9}%`,
                        opacity: 0.9
                    }} 
                />
             </div>
          </div>
        )}

        {/* Cup Body - Contains Liquid & Masks content */}
        <div 
          className={`
            relative w-full h-full border-4 border-stone-200 bg-white/20 backdrop-blur-sm 
            overflow-hidden shadow-xl z-10
            ${config.cupStyle}
          `}
        >
          {/* Liquid Container */}
          <div 
            className={`absolute bottom-0 left-0 right-0 w-full transition-all duration-500 ease-in-out ${config.color}`}
            style={{ height: `${fillPercentage}%` }}
          >
            {/* Surface reflection */}
            <div className="absolute top-0 left-0 w-full h-2 bg-white/20 skew-x-12 origin-left"></div>
            
            {/* Bubbles / Foam */}
            {config.hasFoam && remainingSips > 0 && (
               <div className="absolute -top-3 left-0 w-full h-4 bg-[#eee] rounded-full blur-[2px] opacity-90"></div>
            )}

            {/* Ice Cubes (Only show if liquid is present) */}
            {config.hasIce && remainingSips > 0 && <IceCubes />}
          </div>
          
          {/* Glass Glare */}
          <div className="absolute top-0 left-4 w-4 h-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-full blur-[1px]"></div>
        </div>
      </div>
    </div>
  );
};