/**
 * Campaia Platform - Video Generator Component
 * 
 * UI for generating AI videos with Kling AI.
 * Design consistent with existing dashboard (white bg, Tailwind CSS).
 */

import React, { useState } from 'react';
import { Loader2, Zap, Clock, Crown, Sparkles, AlertCircle, CheckCircle2, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  generateVideo,
  getVideoCost,
  pollVideoStatus,
  VIDEO_STYLES,
  type VideoDuration,
  type VideoQuality,
  type VideoStatusResponse,
  type VideoProvider,
} from '../services/videoService';

interface VideoGeneratorProps {
  prompt: string;
  script?: string;
  campaignId?: string;
  userCredits: number;
  onVideoGenerated?: (video: VideoStatusResponse) => void;
  onCreditsUsed?: (amount: number) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  prompt,
  script,
  campaignId,
  userCredits,
  onVideoGenerated,
  onCreditsUsed,
  onGeneratingChange,
}) => {
  const [editablePrompt, setEditablePrompt] = useState(prompt);
  const [duration, setDuration] = useState<VideoDuration>('5');
  const [quality, setQuality] = useState<VideoQuality>('STANDARD');
  const [provider, setProvider] = useState<VideoProvider>('KLING');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<VideoStatusResponse | null>(null);

  // Update internal prompt when prop changes
  React.useEffect(() => {
    setEditablePrompt(prompt);
  }, [prompt]);

  const cost = getVideoCost(duration, quality, provider);
  const canAfford = userCredits >= cost;

  const handleGenerate = async () => {
    if (!canAfford) {
      setError('Credite insuficiente pentru generare video');
      return;
    }

    setIsGenerating(true);
    onGeneratingChange?.(true);
    setProgress(0);
    setStatus('Se inițializează generarea...');
    setError(null);
    setGeneratedVideo(null);

    try {
      const response = await generateVideo({
        prompt: editablePrompt,
        script,
        campaign_id: campaignId,
        duration,
        quality,
        provider,
      });

      onCreditsUsed?.(response.tokens_cost);
      setStatus('Video în procesare…');

      const finalStatus = await pollVideoStatus(
        response.id,
        (statusUpdate) => {
          setProgress(statusUpdate.progress_percent);

          switch (statusUpdate.status) {
            case 'PENDING':
              setStatus('În așteptare...');
              setProgress(prev => Math.max(prev, 5));
              break;
            case 'PROCESSING':
              setStatus('AI generează videoclipul (9:16)…');
              // Ensure we show at least 15% if it's processing
              if (statusUpdate.progress_percent <= 10) setProgress(15);
              break;
            case 'UPLOADING':
              setStatus('Finalizare și stocare...');
              setProgress(95);
              break;
            case 'COMPLETED':
              setStatus('Finalizat!');
              setProgress(100);
              break;
            case 'FAILED':
              setStatus('Eroare');
              break;
          }
        },
        5000,
        600000
      );

      setGeneratedVideo(finalStatus);
      onVideoGenerated?.(finalStatus);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la generarea video');
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Video generation style (provider) */}
      <div>
        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Video generation style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VIDEO_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setProvider(s.id)}
              disabled={isGenerating}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                provider === s.id
                  ? 'border-purple-500 bg-purple-50 text-purple-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              } disabled:opacity-50`}
            >
              <span className="font-bold block">{s.label}</span>
              <span className="text-xs text-slate-500 mt-1 block">{s.sub}</span>
              <span className="text-[10px] font-bold text-purple-600 mt-2 block">
                {getVideoCost(duration, quality, s.id)} credite
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          Dacă stilul ales nu e disponibil, folosim automat fast generation — ești informat la final.
        </p>
      </div>

      {/* Duration Selector */}
      <div>
        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Durată video
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDuration('5')}
            disabled={isGenerating}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${duration === '5'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              } disabled:opacity-50`}
          >
            <Zap className="w-6 h-6" />
            <span className="font-bold">5 secunde</span>
            <span className="text-xs text-slate-500">Quick & punchy</span>
          </button>
          <button
            type="button"
            onClick={() => setDuration('10')}
            disabled={isGenerating}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${duration === '10'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              } disabled:opacity-50`}
          >
            <Clock className="w-6 h-6" />
            <span className="font-bold">10 secunde</span>
            <span className="text-xs text-slate-500">Mai mult context</span>
          </button>
        </div>
      </div>

      {/* Quality Selector */}
      <div>
        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Calitate
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setQuality('STANDARD')}
            disabled={isGenerating}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${quality === 'STANDARD'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              } disabled:opacity-50`}
          >
            <Sparkles className="w-6 h-6" />
            <span className="font-bold">Standard</span>
            <span className="text-xs text-slate-500">720p, rapid</span>
          </button>
          <button
            type="button"
            onClick={() => setQuality('PROFESSIONAL')}
            disabled={isGenerating}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${quality === 'PROFESSIONAL'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              } disabled:opacity-50`}
          >
            <Crown className="w-6 h-6" />
            <span className="font-bold">Professional</span>
            <span className="text-xs text-slate-500">1080p, premium</span>
          </button>
        </div>
      </div>

      {/* Cost Display */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Cost generare:</span>
          <span className={`text-xl font-bold ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
            {cost} credite
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-slate-500">Sold disponibil:</span>
          <span className={canAfford ? 'text-slate-600' : 'text-red-500 font-medium'}>
            {userCredits.toLocaleString()} credite
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress */}
      {isGenerating && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center animate-pulse">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-purple-900 font-bold block">{status}</span>
                <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">Aproximativ 2-5 minute</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-purple-600 tabular-nums">{progress}%</span>
            </div>
          </div>
          <div className="h-3 bg-purple-200/50 rounded-full overflow-hidden p-1 shadow-inner">
            <motion.div
              layout
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 rounded-full shadow-sm"
              transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            />
          </div>
        </div>
      )}

      {/* Generated Video Preview */}
      {generatedVideo && generatedVideo.video_url && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-700 font-bold mb-4">
            <CheckCircle2 className="w-5 h-5" />
            Video generat cu succes!
          </div>
          <video
            src={generatedVideo.video_url}
            controls
            className="w-full max-w-sm mx-auto rounded-xl bg-black"
            poster={generatedVideo.thumbnail_url || undefined}
          />
          <div className="flex flex-col gap-1 mt-3 text-sm text-slate-600">
            <span>{generatedVideo.duration}s • {generatedVideo.quality} • {generatedVideo.aspect_ratio || '9:16'}</span>
            <span>Generated with: {generatedVideo.provider_used || generatedVideo.provider_requested || 'Kling AI'}</span>
            {generatedVideo.fallback_used && (
              <span className="text-amber-700 text-xs font-medium">Stilul inițial nu a fost disponibil — fast generation.</span>
            )}
            <span>{generatedVideo.tokens_spent} credite</span>
          </div>
        </div>
      )}

      {/* Kling AI Visual Prompt */}
      <div>
        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          Prompt vizual (toate stilurile)
        </label>
        <textarea
          value={editablePrompt}
          onChange={(e) => setEditablePrompt(e.target.value)}
          disabled={isGenerating}
          rows={3}
          className="w-full rounded-xl border-2 border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm focus:border-purple-600 focus:ring-4 focus:ring-purple-600/5 transition-all outline-none resize-none placeholder:text-slate-300 disabled:opacity-50"
          placeholder="Descrie scena vizuală în engleză pentru cele mai bune rezultate..."
        />
        <p className="mt-2 text-[10px] text-slate-400 font-medium italic">
          * Sfat: Păstrează prompt-ul în limba engleză pentru o calitate maximă a videoclipului.
        </p>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || !canAfford || !prompt}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${canAfford && !isGenerating
          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30 hover:scale-[1.02]'
          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Se generează...
          </>
        ) : !canAfford ? (
          <>
            <AlertCircle className="w-5 h-5" />
            Credite insuficiente
          </>
        ) : (
          <>
            <Video className="w-5 h-5" />
            Generează Video ({cost} credite)
          </>
        )}
      </button>

      {!canAfford && (
        <p className="text-center text-sm text-slate-500">
          <a href="/dashboard" className="text-purple-600 hover:underline font-medium">
            Cumpără credite
          </a>{' '}
          pentru a genera videoclipuri
        </p>
      )}
    </div>
  );
};

export default VideoGenerator;
