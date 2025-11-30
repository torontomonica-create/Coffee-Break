import React, { useState, useEffect, useRef } from 'react';
import { Send, Coffee } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ messages, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative pointer-events-none">
      {/* Messages Area - Grow from bottom up to max-height */}
      <div 
        className="mt-auto max-h-[40vh] overflow-y-auto px-5 py-2 space-y-4 pointer-events-none w-full max-w-2xl mx-auto"
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent, black 15%)', 
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%)' 
        }}
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col w-full ${msg.isUser ? 'items-end' : 'items-start'} pointer-events-auto transition-all duration-300 animate-fade-in`}
          >
            {/* Barista Label */}
            {!msg.isUser && msg.sender === 'Barista' && (
              <span className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-1.5 ml-2 flex items-center gap-1">
                <Coffee size={12} strokeWidth={3} /> Barista
              </span>
            )}
            
            <div 
              className={`
                max-w-[85%] px-6 py-3.5 rounded-3xl shadow-sm text-[17px] font-medium leading-relaxed break-words
                ${msg.isUser 
                  ? 'bg-primary text-white rounded-br-sm shadow-md' 
                  : 'bg-surface text-primary rounded-bl-sm border border-stone-100'
                }
              `}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] w-full pointer-events-auto bg-gradient-to-t from-white via-white to-transparent pt-8">
        <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-2xl mx-auto items-end">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Chat with Barista..."
            className="flex-1 min-w-0 px-7 py-4 rounded-full bg-white border border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-primary placeholder-stone-400 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-[16px] font-medium"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="flex-shrink-0 flex-grow-0 p-4 rounded-full bg-primary text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors transform active:scale-95"
          >
            <Send size={22} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
};