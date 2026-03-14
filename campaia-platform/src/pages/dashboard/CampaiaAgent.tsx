import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, User } from 'lucide-react';
import { sendMessage, type ChatMessage } from '../../services/agentService';
import { useLanguage } from '../../context/LanguageContext';

export default function CampaiaAgent() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = language === 'ro' ? {
    title: 'Campaia Agent',
    subtitle: 'Asistentul tău AI de marketing',
    placeholder: 'Scrie un mesaj...',
    welcome: 'Sunt asistentul tău de marketing. Cu ce te pot ajuta?',
    tips: [
      { icon: '📅', text: 'Planificarea campaniilor', desc: 'când și cum să le lansezi' },
      { icon: '⏰', text: 'Programare automată', desc: 'setează zilele și orele active' },
      { icon: '💰', text: 'Optimizare buget', desc: 'ROI maxim pe fiecare leu' },
      { icon: '🎬', text: 'Strategii video TikTok', desc: 'conținut care prinde' },
      { icon: '📊', text: 'Analiză performanță', desc: 'ce merge, ce nu' },
    ],
    error: 'Eroare la comunicarea cu agentul. Verifică cheia Gemini API.',
  } : {
    title: 'Campaia Agent',
    subtitle: 'Your AI marketing assistant',
    placeholder: 'Type a message...',
    welcome: 'I\'m your marketing assistant. How can I help?',
    tips: [
      { icon: '📅', text: 'Campaign planning', desc: 'when and how to launch' },
      { icon: '⏰', text: 'Auto-scheduling', desc: 'set active days and hours' },
      { icon: '💰', text: 'Budget optimization', desc: 'maximize every RON' },
      { icon: '🎬', text: 'TikTok video strategy', desc: 'content that converts' },
      { icon: '📊', text: 'Performance analysis', desc: 'what works, what doesn\'t' },
    ],
    error: 'Error communicating with the agent. Check your Gemini API key.',
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    setInput('');
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: msg };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);
    setSuggestions([]);

    try {
      const res = await sendMessage(msg, messages);
      setMessages([...newHistory, { role: 'assistant', content: res.reply }]);
      if (res.suggestions?.length > 0) setSuggestions(res.suggestions);
    } catch (e) {
      setError(t.error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      {/* Compact header */}
      <div className="flex items-center gap-3 pb-4 mb-1 border-b border-slate-100/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/15">
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-800 leading-tight">{t.title}</h1>
          <p className="text-[11px] text-slate-400 font-medium">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/80 border border-emerald-100 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Online</span>
        </div>
      </div>

      {/* Chat area with custom scrollbar */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-5 space-y-3 pr-1 chat-scroll"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#e2e8f0 transparent',
        }}
      >
        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center pt-8 pb-4 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100/60 flex items-center justify-center mb-5">
              <Sparkles size={24} className="text-purple-500" />
            </div>
            <p className="text-slate-500 font-medium text-sm mb-6">{t.welcome}</p>

            <div className="w-full max-w-sm space-y-2">
              {t.tips.map((tip, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(typeof tip === 'string' ? tip : tip.text)}
                  className="w-full flex items-center gap-3 text-left bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100/80 transition-all hover:border-slate-200 hover:shadow-sm group active:scale-[0.99]"
                >
                  <span className="text-base shrink-0">{tip.icon}</span>
                  <div className="min-w-0">
                    <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{tip.text}</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">{tip.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-slate-800 text-white/95 rounded-br-lg'
                : 'bg-white text-slate-700 border border-slate-100/80 shadow-sm rounded-bl-lg'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-slate-500" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-slate-100/80 shadow-sm rounded-2xl rounded-bl-lg px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50/80 border border-red-100 rounded-xl px-3.5 py-2.5 text-[12px] text-red-600 font-medium">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2.5 pt-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              className="px-3 py-1.5 bg-white border border-purple-100 rounded-full text-[11px] font-semibold text-purple-600 hover:bg-purple-50 hover:border-purple-200 transition-all active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="pt-3 border-t border-slate-100/80">
        <div className="flex items-end gap-2.5 bg-white border border-slate-200/80 rounded-2xl px-3 py-2 shadow-sm focus-within:border-purple-300 focus-within:shadow-md focus-within:shadow-purple-500/5 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={1}
            className="flex-1 resize-none text-[13px] outline-none bg-transparent py-1 placeholder:text-slate-300 text-slate-700 leading-relaxed"
            style={{ maxHeight: '100px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/15 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none shrink-0"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} className="ml-0.5" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-300 mt-2 font-medium">
          Powered by Gemini 2.0 Flash
        </p>
      </div>
    </div>
  );
}
