/**
 * Campaia Platform - My Videos Page
 * 
 * Dashboard page for viewing and managing generated videos.
 * Design consistent with existing dashboard pages (white bg, dark text).
 */

import React, { useState, useEffect } from 'react';
import { Video, Sparkles, Coins, Play, Users, Upload } from 'lucide-react';
import VideoGenerator from '../../components/VideoGenerator';
import VideoGallery from '../../components/VideoGallery';
import CommunityFeed from '../../components/CommunityFeed';
import VideoUpload from '../../components/VideoUpload';
import paymentService, { type WalletBalance } from '../../services/paymentService';
import { useLanguage } from '../../context/LanguageContext';

interface MyVideosProps {
  userCredits: number;
  onCreditsUpdate?: () => void;
}

const MyVideos: React.FC<MyVideosProps> = ({ userCredits, onCreditsUpdate }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'gallery' | 'generate' | 'community' | 'upload'>('gallery');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [credits, setCredits] = useState(userCredits);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);

  const content = {
    ro: {
      title: "Studioul Video",
      subtitle: "Motorul tău creativ pentru conținut viral pe TikTok.",
      gallery: "Proiectele Mele",
      generate: "Creează Video",
      community: "Inspiră-te",
      upload: "Încarcă Video",
      balance: "Resurse AI",
      tokens: "tokens",
      promptTitle: "Viziunea Ta Creativă",
      promptDesc: "Descrie în detaliu atmosfera, culorile și ritmul videoclipului pe care dorești să îl generezi.",
      placeholder: "Ex: O reclamă tech minimalistă cu reflexii de neon violet, camera mișcându-se fluid peste un smartphone elegant, font modern...",
    },
    en: {
      title: "Video Studio",
      subtitle: "Your creative engine for viral TikTok content.",
      gallery: "My Projects",
      generate: "Create Video",
      community: "Inspiration",
      upload: "Upload Video",
      balance: "AI Resources",
      tokens: "tokens",
      promptTitle: "Your Creative Vision",
      promptDesc: "Describe in detail the atmosphere, colors, and rhythm of the video you want to generate.",
      placeholder: "Ex: A minimalist tech ad with purple neon reflections, camera moving smoothly over a sleek smartphone, modern font...",
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    setCredits(userCredits);
  }, [userCredits]);

  useEffect(() => {
    paymentService.getWallet().then(setWallet).catch(console.error);
  }, []);

  const handleCreditsUsed = (amount: number) => {
    setCredits(prev => prev - amount);
    onCreditsUpdate?.();
    paymentService.getWallet().then(setWallet).catch(console.error);
  };

  const handleVideoGenerated = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('gallery');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header with Balance */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-40"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight lg:text-5xl flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
              <Video size={32} />
            </div>
            {t.title}
          </h1>
          <p className="text-slate-500 mt-4 text-lg font-medium max-w-xl">{t.subtitle}</p>
        </div>

        <div className="relative z-10 bg-slate-900 rounded-[2rem] p-6 sm:p-8 flex items-center gap-6 shadow-2xl shadow-slate-950/20">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Coins className="w-9 h-9 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t.balance}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">{wallet?.balance ?? credits}</span>
              <span className="text-xs font-black text-purple-400 uppercase">{t.tokens}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-100 rounded-[2rem] max-w-fit mx-auto lg:mx-0">
        {[
          { id: 'gallery', label: t.gallery, icon: Play },
          { id: 'upload', label: t.upload, icon: Upload },
          { id: 'generate', label: t.generate, icon: Sparkles },
          { id: 'community', label: t.community, icon: Users }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-3xl font-black text-sm transition-all duration-300 active:scale-95
                    ${activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
          >
            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Container */}
      <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'gallery' ? (
          <VideoGallery refreshTrigger={refreshTrigger} />
        ) : activeTab === 'community' ? (
          <CommunityFeed />
        ) : activeTab === 'upload' ? (
          <div className="max-w-2xl mx-auto">
            <VideoUpload
              onUploadComplete={() => {
                setRefreshTrigger(prev => prev + 1);
                setActiveTab('gallery');
              }}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 sm:p-14 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t.promptTitle}</h3>
                    <p className="text-slate-500 font-medium text-base">{t.promptDesc}</p>
                  </div>
                </div>
              </div>

              <QuickVideoGenerator
                userCredits={wallet?.balance ?? credits}
                onCreditsUsed={handleCreditsUsed}
                onVideoGenerated={handleVideoGenerated}
                placeholder={t.placeholder}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Quick Video Generator with prompt input
interface QuickVideoGeneratorProps {
  userCredits: number;
  onCreditsUsed: (amount: number) => void;
  onVideoGenerated: () => void;
  placeholder: string;
}

const QuickVideoGenerator: React.FC<QuickVideoGeneratorProps> = ({
  userCredits,
  onCreditsUsed,
  onVideoGenerated,
  placeholder,
}) => {
  const [prompt, setPrompt] = useState('');

  const styles = [
    { label: 'Cinematic', icon: '🎬', prompt: 'Professional cinematic advertisement, 8k, bokeh background, warm lighting, slow tracking shot.' },
    { label: 'UGC Style', icon: '📱', prompt: 'Natural lighting, shot on iPhone, authentic handheld camera movement, high energy, relatable setting.' },
    { label: 'Product Focus', icon: '💎', prompt: 'Macro shot, studio lighting, hyper-detailed textures, rotating product, minimalist background.' },
    { label: 'Vibrant', icon: '🌈', prompt: 'Electric colors, fast-paced editing style, neon accents, dynamic camera angles, high contrast.' }
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {styles.map((style) => (
            <button
              key={style.label}
              onClick={() => setPrompt(style.prompt)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 hover:border-purple-200 hover:bg-purple-50 transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{style.icon}</span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{style.label}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            className="w-full p-8 border-2 border-slate-100 rounded-[2rem] text-lg font-medium text-slate-800 placeholder-slate-300 focus:border-purple-500 focus:ring-[10px] focus:ring-purple-600/5 outline-none transition-all resize-none shadow-inner min-h-[200px]"
          />
          {prompt && (
            <button
              onClick={() => setPrompt('')}
              className="absolute bottom-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {prompt.length > 5 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <VideoGenerator
            prompt={prompt}
            userCredits={userCredits}
            onCreditsUsed={onCreditsUsed}
            onVideoGenerated={onVideoGenerated}
          />
        </div>
      )}
    </div>
  );
};

export default MyVideos;
