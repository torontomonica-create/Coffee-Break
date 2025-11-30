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
        className="mt-auto max-h-[25vh] overflow-y-auto px-4 py-2 space-y-3 pointer-events-none w-full max-w-2xl mx-auto"
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent, black 20%)', 
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%)' 
        }}
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col w-full ${msg.isUser ? 'items-end' : 'items-start'} pointer-events-auto transition-all duration-300 animate-fade-in`}
          >
            {/* Barista Label */}
            {!msg.isUser && msg.sender === 'Barista' && (
              <span className="text-[10px] font-bold text-coffee-700 uppercase tracking-wider mb-1 ml-1 flex items-center gap-1">
                <Coffee size={10} /> Barista
              </span>
            )}
            
            <div 
              className={`
                max-w-[85%] px-4 py-2 rounded-2xl shadow-sm text-sm break-words
                ${msg.isUser 
                  ? 'bg-coffee-600 text-white rounded-br-none' 
                  : 'bg-white/90 text-stone-800 rounded-bl-none border border-stone-200'
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
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] w-full pointer-events-auto bg-gradient-to-t from-stone-50/50 to-transparent">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Chat with Barista..."
            className="flex-1 min-w-0 px-4 py-3 rounded-full bg-white/90 border-0 shadow-lg text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-coffee-400 focus:outline-none backdrop-blur-md"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="flex-shrink-0 flex-grow-0 p-3 rounded-full bg-coffee-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-coffee-700 transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};