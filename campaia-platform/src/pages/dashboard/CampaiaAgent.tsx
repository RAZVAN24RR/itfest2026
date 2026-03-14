import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, User, Zap } from 'lucide-react';
import { sendMessage, type ChatMessage } from '../../services/agentService';
import { useLanguage } from '../../context/LanguageContext';

export default function CampaiaAgent() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = language === 'ro' ? {
    title: 'Campaia Agent',
    subtitle: 'Asistentul tău AI de marketing',
    placeholder: 'Întreabă-mă despre campanii, strategie, timing...',
    welcome: 'Bună! Sunt Campaia Agent, asistentul tău de marketing. Te pot ajuta cu:',
    tips: [
      'Planificarea campaniilor — când și cum să le lansezi',
      'Programare automată — setează zilele și orele active',
      'Optimizarea bugetului și a audiențelor',
      'Strategii de conținut video pentru TikTok',
      'Analiza performanței și sugestii de îmbunătățire',
    ],
    askMe: 'Întreabă-mă orice despre marketing!',
    error: 'Eroare la comunicarea cu agentul. Verifică cheia Gemini API.',
  } : {
    title: 'Campaia Agent',
    subtitle: 'Your AI marketing assistant',
    placeholder: 'Ask me about campaigns, strategy, timing...',
    welcome: 'Hi! I\'m Campaia Agent, your marketing assistant. I can help with:',
    tips: [
      'Campaign planning — when and how to launch',
      'Auto-scheduling — set active days and hours',
      'Budget and audience optimization',
      'Video content strategies for TikTok',
      'Performance analysis and improvement tips',
    ],
    askMe: 'Ask me anything about marketing!',
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
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Bot size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t.title}</h1>
          <p className="text-sm text-slate-400 font-medium">{t.subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-green-700 uppercase">Gemini 2.0 Flash</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-6">
              <Sparkles size={32} className="text-purple-600" />
            </div>
            <p className="text-slate-600 font-medium mb-4">{t.welcome}</p>
            <div className="grid gap-2 w-full max-w-md">
              {t.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 text-left bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <Zap size={14} className="text-purple-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-600">{tip}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-400 font-bold uppercase tracking-widest">{t.askMe}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-slate-900 text-white rounded-br-md'
                : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-md'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                <User size={16} className="text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                <span>{language === 'ro' ? 'Gândesc...' : 'Thinking...'}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={1}
            className="flex-1 resize-none rounded-2xl border-2 border-slate-100 focus:border-purple-400 focus:ring-0 px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-300"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
