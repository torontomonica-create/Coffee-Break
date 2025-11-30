import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CoffeeType, AppStatus, CoffeeStats, ChatMessage } from './types';
import { MAX_SIPS, DEFAULT_DURATION, MIN_DURATION, MAX_DURATION, DURATION_STEP, COFFEE_CONFIG } from './constants';
import { CoffeeCup } from './components/CoffeeCup';
import { Timer } from './components/Timer';
import { ChatOverlay } from './components/ChatOverlay';
import { StatsFooter } from './components/StatsFooter';
import { Coffee, RotateCw, LogOut, Clock } from 'lucide-react';
import { GoogleGenAI, Chat } from "@google/genai";

// --- Constants for Persistence & Sync ---
const STORAGE_KEY = 'coffee_break_stats_v1';
const CHANNEL_NAME = 'coffee_break_channel';
const SESSION_ID = Math.random().toString(36).substr(2, 9); // Unique ID for this tab

const App: React.FC = () => {
  // --- State ---
  const [status, setStatus] = useState<AppStatus>(AppStatus.MENU);
  const [selectedCoffee, setSelectedCoffee] = useState<CoffeeType | null>(null);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_DURATION);
  const [sipsTaken, setSipsTaken] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Real-time tracking
  const [activePeers, setActivePeers] = useState<Record<string, number>>({ [SESSION_ID]: Date.now() });
  
  // Stats (Initialized from LocalStorage)
  const [stats, setStats] = useState<CoffeeStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load stats from localStorage", e);
    }
    return {
      iced: 0,
      double: 0,
      cappuccino: 0,
      totalUsers: 1,
    };
  });

  // Refs
  const timerRef = useRef<number | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const baristaChatRef = useRef<Chat | null>(null);

  // --- Helpers ---
  
  const mapTypeToStatKey = (type: CoffeeType): keyof CoffeeStats | null => {
    if (type === CoffeeType.ICED_COFFEE) return 'iced';
    if (type === CoffeeType.DOUBLE_DOUBLE) return 'double';
    if (type === CoffeeType.CAPPUCCINO) return 'cappuccino';
    return null;
  };

  const saveStatsToStorage = (newStats: CoffeeStats) => {
    try {
      // We don't save totalUsers to storage as it's transient
      const storageData = { ...newStats, totalUsers: 0 }; 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    } catch (e) {
      console.warn("Failed to save stats to localStorage", e);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Real-time Logic (BroadcastChannel) ---
  useEffect(() => {
    // 1. Setup Channel
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === 'HEARTBEAT') {
        // Record that we saw this peer
        setActivePeers(prev => ({ ...prev, [payload.id]: Date.now() }));
      } else if (type === 'CUP_FINISHED') {
        // Someone else finished a coffee
        setStats(prev => {
           const newStats = { ...prev };
           const key = mapTypeToStatKey(payload.coffeeType);
           if (key) {
             newStats[key]++;
           }
           // Sync to local storage to keep count consistent
           saveStatsToStorage(newStats);
           return newStats;
        });
      }
    };

    // 2. Heartbeat Sender (I'm alive!)
    const heartbeatInterval = setInterval(() => {
      channel.postMessage({ type: 'HEARTBEAT', payload: { id: SESSION_ID } });
      
      // Also prune old peers who haven't sent a heartbeat in 5 seconds
      setActivePeers(prev => {
        const now = Date.now();
        const next = { ...prev };
        let changed = false;
        
        // Always keep self
        next[SESSION_ID] = now;

        Object.keys(next).forEach(id => {
          if (id !== SESSION_ID && now - next[id] > 5000) {
            delete next[id];
            changed = true;
          }
        });
        
        return changed ? next : prev;
      });
    }, 1000);

    // Initial announcement
    channel.postMessage({ type: 'HEARTBEAT', payload: { id: SESSION_ID } });

    return () => {
      clearInterval(heartbeatInterval);
      channel.close();
    };
  }, []);

  // Sync total users count to stats object for display
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      totalUsers: Object.keys(activePeers).length
    }));
  }, [activePeers]);

  // --- Effects ---

  // Timer Countdown
  useEffect(() => {
    if (status === AppStatus.DRINKING) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // --- Handlers ---

  const initBaristaChat = async (coffeeType: CoffeeType) => {
    // Reset previous session chat
    baristaChatRef.current = null;

    // Fallback immediately if no key provided
    if (!process.env.API_KEY) {
      setMessages([{
        id: 'barista-no-key',
        text: "API Key 설정이 필요합니다. (Netlify 설정 확인)",
        isUser: false,
        sender: 'Barista',
        timestamp: Date.now()
      }]);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const coffeeName = COFFEE_CONFIG[coffeeType].name;
      
      // Context: Calculate how many cups user had including this one
      const totalCups = stats.iced + stats.double + stats.cappuccino + 1;
      
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `You are a cool, humorous, and chill barista at a virtual coffee shop. 
          A customer is taking a ${formatDuration(breakDuration)} break with a "${coffeeName}".
          This is their cup #${totalCups} today.
          
          - Keep responses EXTREMELY SHORT (max 1 sentence, under 15 words).
          - Be funny, witty, and a bit dry.
          - If they've had a lot of coffee (more than 3), comment on their jitters.
          - Don't be overly enthusiastic or formal.
          - Just casual banter.`
        }
      });
      
      baristaChatRef.current = newChat;

      // Generate initial greeting
      const response = await newChat.sendMessage({
        message: `I just ordered a ${coffeeName}. Serve it and say something short and funny.`
      });
      
      setMessages([{
        id: 'barista-init',
        text: response.text || "Here's your fuel. Enjoy.",
        isUser: false,
        sender: 'Barista',
        timestamp: Date.now()
      }]);

    } catch (error) {
      console.error("Failed to init barista", error);
      // Fallback greeting if API fails
      setMessages([{
        id: 'barista-fallback',
        text: "Coffee's ready. (AI Connection Issue)",
        isUser: false,
        sender: 'Barista',
        timestamp: Date.now()
      }]);
    }
  };

  const handleStart = (type: CoffeeType) => {
    setSelectedCoffee(type);
    setSipsTaken(0);
    setTimeLeft(breakDuration); // Use selected duration
    setMessages([]); // Clear old messages
    setStatus(AppStatus.DRINKING);
    
    // Start the Barista conversation
    initBaristaChat(type);
  };

  const handleSip = () => {
    if (status !== AppStatus.DRINKING) return;
    
    setSipsTaken(prev => {
      const newSips = prev + 1;
      if (newSips >= MAX_SIPS) {
        handleFinish(true); // true = manually finished by drinking
      }
      return newSips;
    });
  };

  const handleFinish = useCallback((finishedByDrinking = false) => {
    setStatus(AppStatus.FINISHED);
    if (timerRef.current) clearInterval(timerRef.current);

    // Only count stats if actually finished drinking
    if (finishedByDrinking && selectedCoffee) {
      setStats(prev => {
        const newStats = { ...prev };
        const key = mapTypeToStatKey(selectedCoffee);
        if (key) {
          newStats[key]++;
        }
        saveStatsToStorage(newStats);
        return newStats;
      });

      // Broadcast to other tabs (Stats only)
      channelRef.current?.postMessage({
        type: 'CUP_FINISHED',
        payload: { coffeeType: selectedCoffee }
      });
    }
  }, [selectedCoffee]);

  const handleRestart = () => {
    setStatus(AppStatus.MENU);
    setSelectedCoffee(null);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);

    // Send to Barista AI
    if (baristaChatRef.current) {
      try {
        const result = await baristaChatRef.current.sendMessage({ message: text });
        const baristaMsg: ChatMessage = {
          id: Date.now().toString() + '_b',
          text: result.text || "...",
          isUser: false,
          sender: 'Barista',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, baristaMsg]);
      } catch (err) {
        console.error("Barista error", err);
      }
    }
  };

  // --- Renders ---

  const renderMenu = () => (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-4 md:p-6 pt-[max(1.5rem,env(safe-area-inset-top))] animate-fade-in bg-stone-50">
      <div className="flex flex-col items-center mt-4 mb-6">
        <div className="p-4 bg-coffee-100 rounded-full mb-4">
          <Coffee size={40} className="text-coffee-600" />
        </div>
        <h1 className="text-3xl font-bold text-coffee-800 mb-2">Coffee Break</h1>
        <p className="text-stone-500 text-center text-sm">
          Select your drink and relax.
        </p>
      </div>

      {/* Break Duration Slider */}
      <div className="mb-6 px-2">
        <div className="flex justify-between items-center mb-2">
           <div className="flex items-center gap-2 text-coffee-800 font-medium">
             <Clock size={16} />
             <span>Set Break Duration</span>
           </div>
           <span className="text-coffee-600 font-mono font-bold bg-coffee-100 px-2 py-0.5 rounded text-sm">
             {formatDuration(breakDuration)}
           </span>
        </div>
        <input
          type="range"
          min={MIN_DURATION}
          max={MAX_DURATION}
          step={DURATION_STEP}
          value={breakDuration}
          onChange={(e) => setBreakDuration(Number(e.target.value))}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-coffee-600 focus:outline-none focus:ring-2 focus:ring-coffee-400"
        />
        <div className="flex justify-between text-xs text-stone-400 mt-1 font-mono">
           <span>1:00</span>
           <span>2:00</span>
           <span>3:00</span>
           <span>4:00</span>
           <span>5:00</span>
        </div>
      </div>

      <div className="grid gap-4 flex-1 overflow-y-auto pb-24 no-scrollbar">
        {Object.entries(COFFEE_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleStart(key as CoffeeType)}
            className="group relative flex items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-100 hover:border-coffee-300 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className={`w-16 h-16 rounded-full ${config.color} mr-4 flex-shrink-0 shadow-inner flex items-center justify-center`}>
                <Coffee className="text-white/50" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg text-stone-800 group-hover:text-coffee-700 transition-colors">
                {config.name}
              </h3>
              <p className="text-sm text-stone-400">{config.description}</p>
            </div>
          </button>
        ))}
      </div>
      
      <div className="fixed bottom-0 left-0 w-full z-20">
        <StatsFooter stats={stats} />
      </div>
    </div>
  );

  const renderActiveBreak = () => (
    <div className="relative h-full flex flex-col bg-stone-50 overflow-hidden w-full">
      {/* Header - Absolute top */}
      <div className="absolute top-0 left-0 w-full p-4 pt-[max(1.5rem,env(safe-area-inset-top))] flex justify-between items-start z-30 pointer-events-none">
         <div className="pointer-events-auto">
             <button onClick={() => handleFinish(false)} className="p-2 bg-white/50 rounded-full text-stone-500 hover:bg-stone-200 backdrop-blur-sm shadow-sm transition-colors">
                 <LogOut size={20} />
             </button>
         </div>
         <div className="pointer-events-auto">
           <Timer secondsRemaining={timeLeft} onTimeUp={() => handleFinish(false)} />
         </div>
      </div>

      {/* Main Content - Flex container that fills available space */}
      <div className="flex-1 relative flex flex-col w-full h-full">
        
        {/* Coffee Layer - Shifted UP to prevent overlap with chat */}
        <div className="absolute inset-0 flex items-start justify-center pt-[15vh] z-0 pointer-events-auto px-4">
          {selectedCoffee && (
            <CoffeeCup 
              type={selectedCoffee} 
              sipsTaken={sipsTaken} 
              onSip={handleSip} 
            />
          )}
        </div>

        {/* Chat Layer - Overlays coffee but constrained by internal styling */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end">
           <ChatOverlay messages={messages} onSendMessage={handleSendMessage} />
        </div>
      </div>
      
       {/* Footer - Fixed at bottom of flex container */}
       <div className="relative z-20 w-full flex-shrink-0 bg-stone-50">
        <StatsFooter stats={stats} />
      </div>
    </div>
  );

  const renderFinished = () => (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] bg-stone-100 text-center animate-fade-in select-none">
       <div className="mb-8 p-6 bg-white rounded-full shadow-lg">
        {sipsTaken >= MAX_SIPS ? (
            <div className="text-4xl">😋</div>
        ) : (
             <div className="text-4xl">⏰</div>
        )}
       </div>
      
      <h2 className="text-3xl font-bold text-coffee-800 mb-4">
        {sipsTaken >= MAX_SIPS ? "All done!" : "Break's Over"}
      </h2>
      
      <p className="text-lg text-stone-600 mb-8 max-w-xs leading-relaxed">
        {sipsTaken >= MAX_SIPS 
          ? "Your break is up.\nRecharged and ready!" 
          : "Time is up.\nLet's finish the coffee next time."}
      </p>

      <div className="p-4 bg-white/50 rounded-xl mb-10 w-full max-w-xs mx-auto">
          <p className="text-sm text-stone-500 mb-2">My Break Stats</p>
          <div className="flex justify-between items-center font-mono text-lg text-coffee-700 font-bold">
            <span>{COFFEE_CONFIG[selectedCoffee!].name}</span>
            <span>{Math.round((sipsTaken / MAX_SIPS) * 100)}%</span>
          </div>
      </div>

      <button
        onClick={handleRestart}
        className="flex items-center justify-center space-x-2 px-8 py-4 bg-coffee-600 text-white rounded-full shadow-lg hover:bg-coffee-700 hover:shadow-xl transition-all active:scale-95 w-full max-w-xs"
      >
        <RotateCw size={20} />
        <span className="font-bold">Drink Again</span>
      </button>
      
      <p className="mt-8 text-stone-400 text-sm">Let's drink together again soon!</p>
    </div>
  );

  return (
    <div className="w-full h-[100dvh] bg-stone-50 overflow-hidden text-stone-900">
      {status === AppStatus.MENU && renderMenu()}
      {status === AppStatus.DRINKING && renderActiveBreak()}
      {status === AppStatus.FINISHED && renderFinished()}
    </div>
  );
};

export default App;