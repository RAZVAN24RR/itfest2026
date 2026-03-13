import { ChevronRight, Loader2, Send, CheckCircle2, Sparkles, CreditCard, Users, RefreshCw, Coins, AlertCircle, Video, Play, Wifi, Battery, Signal, Heart, MessageCircle, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CampaignData } from "../../interfaces/campaign.ts";
import { useEffect, useState, useRef } from "react";
import aiService, { type ToneType, AI_COSTS } from "../../services/aiService";
import paymentService from "../../services/paymentService";
import VideoGenerator from '../../components/VideoGenerator';
import VideoGallery from '../../components/VideoGallery';
import type { VideoListItem, VideoStatusResponse } from '../../services/videoService';
import SimpleTargetingSelector, { type SimpleTargetingData, TIKTOK_AGE_GROUPS, toTikTokTargeting } from '../../components/targeting/SimpleTargetingSelector';

interface NewCampaignProps {
    onPublish: (data: CampaignData) => void;
    onCancel: () => void;
    lang: string;
}

const TONES: { id: ToneType; labelRo: string; labelEn: string; icon: string }[] = [
    { id: 'viral', labelRo: 'Viral', labelEn: 'Viral', icon: '🔥' },
    { id: 'professional', labelRo: 'Profesional', labelEn: 'Professional', icon: '💼' },
    { id: 'casual', labelRo: 'Relaxat', labelEn: 'Casual', icon: '😎' },
    { id: 'funny', labelRo: 'Amuzant', labelEn: 'Funny', icon: '😂' },
];

export default function NewCampaign({ onPublish, onCancel, lang }: NewCampaignProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isVideoGenerating, setIsVideoGenerating] = useState(false);
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [selectedTone, setSelectedTone] = useState<ToneType>('viral');
    const [scriptVariants, setScriptVariants] = useState<string[]>([]);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [aiError, setAiError] = useState<string | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [selectedVideo, setSelectedVideo] = useState<VideoListItem | null>(null);
    const [videoMode, setVideoMode] = useState<'create' | 'select'>('create');
    const isBusy = isLoading || isVideoGenerating || isPublishing;

    const [formData, setFormData] = useState<CampaignData>({
        name: '',
        url: '',
        budget: 50,
        productDesc: '',
        aiScript: '',
        videoId: ''
    });

    // Simple TikTok-compatible targeting
    const [targetingData, setTargetingData] = useState<SimpleTargetingData>({
        countries: ['RO'],
        ageGroups: TIKTOK_AGE_GROUPS.map(a => a.id), // All ages by default
        gender: 'GENDER_UNLIMITED'
    });

    // Fetch token balance on mount
    useEffect(() => {
        paymentService.getWallet().then(w => setTokenBalance(w.balance)).catch(console.error);
    }, []);

    const [showSuccess, setShowSuccess] = useState(false);

    const handlePublishClick = async () => {
        setIsPublishing(true);
        try {
            await onPublish({
                ...formData,
                aiScript: scriptVariants[selectedVariantIndex] || formData.aiScript,
                targeting: toTikTokTargeting(targetingData)  // Convert to TikTok format
            });
            setShowSuccess(true);
        } catch (error) {
            console.error("Publish failed", error);
        } finally {
            setIsPublishing(false);
        }
    };

    const texts = {
        ro: {
            steps: { s1: "Configurare", s2: "AI Creative", s3: "Audiență", s4: "Video Creative", s5: "Review" },
            s1: { title: "Detaliile Campaniei", sub: "Cum se numește campania și unde trimitem traficul?", labelName: "Nume Campanie", labelUrl: "Link Destinație (Website / Promo)", labelBudget: "Buget Promovare (tokens)", btnNext: "Pasul Următor", tokensPerDay: "tokens", viewsEstimate: "Vizualizări estimate" },
            s2: {
                title: "AI Creative Assistant",
                sub: "Descrie inițiativa, alege tonul și AI-ul generează 5 variante de script.",
                labelDesc: "Despre ce este inițiativa/proiectul?",
                labelTone: "Alege tonul scriptului",
                btnBack: "Înapoi",
                btnGen: "Generare Scripturi",
                cost: "Cost:",
                tokens: "tokens",
                balance: "Sold:",
                selectVariant: "Alege varianta preferată:",
                variant: "Varianta",
                regenerate: "Regenerează",
                noBalance: "Sold insuficient! Cumpără tokens pentru a continua.",
                buyTokens: "Cumpără Tokens"
            },
            s3: {
                title: "Audience Targeting",
                sub: "Definește cine va vedea reclama ta pe TikTok.",
                btnNext: "Video Creative"
            },
            s4: {
                title: "Video Creative",
                sub: "Generează sau alege un videoclip pentru campania ta.",
                btnNext: "Review Final"
            },
            s5: {
                title: "Review Final",
                sub: "Verifică detaliile campaniei înainte de publicare.",
                labelScript: "Script Generat de AI",
                labelVideo: "Video Creativ",
                labelDetails: "Detalii Campanie",
                labelTargeting: "Audiență Targetată",
                btnPub: "Publică Campania",
                day: "zi",
                noVideo: "Niciun video selectat"
            },
            success: { title: "Campanie Trimisă!", sub: "Echipa noastră a preluat scriptul.", back: "Înapoi la Dashboard" },
            loading: ["Analizăm documentația...", "Scriem mesaje cheie...", "Optimizăm pentru TikTok...", "Generăm variante..."]
        },
        en: {
            steps: { s1: "Setup", s2: "AI Creative", s3: "Audience", s4: "Video Creative", s5: "Review" },
            s1: { title: "Campaign Details", sub: "What is the name and where do we send traffic?", labelName: "Campaign Name", labelUrl: "Destination Link (Website / Promo)", labelBudget: "Promotion Budget (tokens)", btnNext: "Next Step", tokensPerDay: "tokens", viewsEstimate: "Estimated views" },
            s2: {
                title: "AI Creative Assistant",
                sub: "Describe your product, choose the tone, and AI generates 5 script variants.",
                labelDesc: "What is your product about?",
                labelTone: "Choose script tone",
                btnBack: "Back",
                btnGen: "Generate Scripts",
                cost: "Cost:",
                tokens: "tokens",
                balance: "Balance:",
                selectVariant: "Choose your preferred variant:",
                variant: "Variant",
                regenerate: "Regenerate",
                noBalance: "Insufficient balance! Buy tokens to continue.",
                buyTokens: "Buy Tokens"
            },
            s3: {
                title: "Audience Targeting",
                sub: "Define who will see your ad on TikTok.",
                btnNext: "Video Creative"
            },
            s4: {
                title: "Video Creative",
                sub: "Generate or select a video for your campaign.",
                btnNext: "Final Review"
            },
            s5: {
                title: "Final Review",
                sub: "Review your campaign details before publishing.",
                labelScript: "AI Generated Script",
                labelVideo: "Video Creative",
                labelDetails: "Campaign Details",
                labelTargeting: "Target Audience",
                btnPub: "Publish Campaign",
                day: "day",
                noVideo: "No video selected"
            },
            success: { title: "Campaign Submitted!", sub: "Our team received the script.", back: "Back to Dashboard" },
            loading: ["Analyzing product...", "Writing viral hooks...", "Optimizing for TikTok...", "Generating variants..."]
        }
    };

    const t = lang === 'ro' ? texts.ro : texts.en;

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            interval = setInterval(() => {
                setLoadingMsgIndex((prev) => (prev + 1) % t.loading.length);
            }, 800);
        }
        return () => clearInterval(interval);
    }, [isLoading, t.loading.length]);

    const handleGenerateAI = async () => {
        if (!formData.productDesc) return;

        // Check balance (Total cost = script + marketing desc + kling prompt)
        const totalCost = AI_COSTS.SCRIPT_GENERATION + AI_COSTS.MARKETING_DESCRIPTION + AI_COSTS.KLING_PROMPT;
        if (tokenBalance < totalCost) {
            setAiError(t.s2.noBalance);
            return;
        }

        setIsLoading(true);
        setAiError(null);

        try {
            // Run all AI generations in parallel
            const [scriptRes, marketingRes, klingRes] = await Promise.all([
                aiService.generateScript({
                    product_description: formData.productDesc,
                    product_url: formData.url,
                    tone: selectedTone,
                    duration_seconds: 15,
                    language: lang === 'ro' ? 'ro' : 'en',
                    variants: 5,
                }),
                aiService.generateMarketingDescription(formData.productDesc, lang === 'ro' ? 'ro' : 'en'),
                aiService.generateKlingPrompt(formData.productDesc, lang === 'ro' ? 'ro' : 'en')
            ]);

            setScriptVariants(scriptRes.scripts);
            setSelectedVariantIndex(0);

            setFormData(prev => ({
                ...prev,
                aiScript: scriptRes.scripts[0] || '',
                marketingDescription: marketingRes.description,
                klingPrompt: klingRes.prompt
            }));

            const spent = scriptRes.tokens_spent + marketingRes.tokens_spent + klingRes.tokens_spent;
            setTokenBalance(prev => prev - spent);
            setCurrentStep(3);
        } catch (error) {
            console.error("AI generation failed", error);
            setAiError("AI generation failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectVariant = async (index: number) => {
        const selectedScript = scriptVariants[index];
        setSelectedVariantIndex(index);
        setFormData(prev => ({
            ...prev,
            aiScript: selectedScript || ''
        }));

        // Automatically update the Kling visual prompt based on the NEW selected script
        if (selectedScript) {
            try {
                // We use the selected script as the new basis for the visual prompt
                const response = await aiService.generateKlingPrompt(selectedScript, lang === 'ro' ? 'ro' : 'en');
                setFormData(prev => ({
                    ...prev,
                    klingPrompt: response.prompt
                }));
                // Note: We don't necessarily deduct tokens here in UI unless we want to be strict, 
                // but the API will deduct them. Let's update balance to keep it in sync.
                setTokenBalance(prev => prev - response.tokens_spent);
            } catch (err) {
                console.error("Failed to update visual prompt", err);
            }
        }
    };

    const handleVideoSelected = (video: VideoListItem) => {
        setSelectedVideo(video);
        setFormData(prev => ({
            ...prev,
            videoId: video.id
        }));
    };

    const handleVideoGeneratedFromComponent = (videoStatus: VideoStatusResponse) => {
        // Convert status response to list item for state
        const videoItem: VideoListItem = {
            id: videoStatus.id,
            status: 'COMPLETED', // It's finished if we get here via callback usually, or we trust the component
            video_url: videoStatus.video_url,
            thumbnail_url: videoStatus.thumbnail_url,
            duration: videoStatus.duration,
            quality: videoStatus.quality,
            prompt: 'Generated in Campaign',
            tokens_spent: videoStatus.tokens_spent,
            created_at: videoStatus.created_at,
            campaign_id: null
        };
        handleVideoSelected(videoItem);
    };

    const canProceedToStep2 = formData.name && formData.name.length >= 2 && formData.url.length > 3 && formData.budget > 0;
    const hasEnoughTokens = tokenBalance >= AI_COSTS.SCRIPT_GENERATION;

    if (showSuccess) {
        return (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto mt-20 text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-green-50 mb-8 border border-green-100 animate-bounce">
                    <CheckCircle2 className="h-14 w-14 text-green-500" />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-800 mb-4">{t.success.title}</h2>
                <p className="text-slate-500 text-lg mb-10 font-medium">{t.success.sub}</p>
                <button
                    type={'button'}
                    onClick={onCancel}
                    className="px-8 py-4 text-sm font-bold rounded-xl transition-all duration-200 border shadow-sm focus:outline-none active:scale-95 !bg-white border-slate-200 !text-slate-500 hover:!border-purple-400 hover:!text-purple-600 hover:shadow-md"
                >
                    {t.success.back}
                </button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pt-8">
            {/* Premium Progress Indicator */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {currentStep === 1 ? t.s1.title :
                                currentStep === 2 ? t.s2.title :
                                    currentStep === 3 ? t.s3.title :
                                        currentStep === 4 ? t.s4.title : t.s5.title}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            {currentStep === 1 ? t.s1.sub :
                                currentStep === 2 ? t.s2.sub :
                                    currentStep === 3 ? t.s3.sub :
                                        currentStep === 4 ? t.s4.sub : t.s5.sub}
                        </p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-4xl font-black text-slate-800 tabular-nums">0{currentStep}</span>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest block -mt-2">Step</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((step) => (
                        <div key={step} className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                            <motion.div
                                className="h-full bg-slate-900"
                                initial={false}
                                animate={{
                                    width: currentStep >= step ? '100%' : '0%',
                                    backgroundColor: currentStep === step ? '#8B5CF6' : (currentStep > step ? '#0F172A' : '#F1F5F9')
                                }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white shadow-2xl shadow-slate-200/60 border border-slate-100 rounded-[2.5rem] p-8 sm:p-12 min-h-[500px] flex flex-col relative overflow-hidden">
                {isBusy && (
                    <div className="absolute inset-0 z-50 bg-white/20 backdrop-blur-[2px] cursor-wait" />
                )}
                <AnimatePresence mode="wait">
                    {/* STEP 1 */}
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                            <div className="grid gap-10">
                                <div className="space-y-4">
                                    <label htmlFor={'name'} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.s1.labelName}</label>
                                    <input
                                        id={'name'}
                                        type="text"
                                        placeholder="Ex: Campanie Lansare C++"
                                        className="block w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-5 text-lg font-bold text-slate-900 shadow-sm focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/5 transition-all outline-none placeholder:text-slate-300"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label htmlFor={'url'} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.s1.labelUrl}</label>
                                    <div className="relative group">
                                        <input
                                            id={'url'}
                                            type="text"
                                            placeholder="https://yourstore.com/product"
                                            className="block w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-5 text-lg font-bold text-slate-900 shadow-sm focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/5 transition-all outline-none placeholder:text-slate-300"
                                            value={formData.url}
                                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                                            <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor={'budget'} className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.s1.labelBudget}</label>
                                        <div className="flex items-center gap-3">
                                            <div className="px-4 py-2 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10">
                                                <span className="text-xl font-black text-white tabular-nums">{formData.budget}</span>
                                                <span className="text-[10px] font-black text-purple-400 uppercase ml-2 tracking-widest">{t.s1.tokensPerDay}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative group p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <input
                                            id={'budget'}
                                            type="range"
                                            min="10"
                                            max="500"
                                            step="10"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                            className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">
                                            <span>MIN (10)</span>
                                            <span>MAX (500)</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mt-4 bg-green-50 rounded-xl p-3 border border-green-100">
                                        <span className="text-xs font-bold text-green-600 uppercase">{t.s1.viewsEstimate}:</span>
                                        <span className="text-lg font-black text-green-700">~{Math.round(formData.budget * 100).toLocaleString()}</span>
                                        <span className="text-xs text-green-500">👀</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <button
                                    type={'button'}
                                    onClick={() => setCurrentStep(2)}
                                    disabled={!canProceedToStep2}
                                    className="group flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl hover:bg-black hover:shadow-2xl hover:shadow-slate-900/20 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all font-black text-sm uppercase tracking-widest"
                                >
                                    {t.s1.btnNext}
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2 */}
                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            {/* Header Status */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.s2.balance}</p>
                                        <Coins size={16} className="text-amber-400" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black">{tokenBalance}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{t.s2.tokens}</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-purple-50 rounded-3xl p-6 border border-purple-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{t.s2.cost}</p>
                                        <Sparkles size={16} className="text-purple-600" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-purple-700">{AI_COSTS.SCRIPT_GENERATION}</span>
                                        <span className="text-[10px] font-black text-purple-400 uppercase">{t.s2.tokens}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Error / No Balance */}
                            {aiError && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 p-5 rounded-2xl">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-bold text-sm flex-1">{aiError}</span>
                                    {!hasEnoughTokens && (
                                        <button
                                            onClick={() => window.location.href = '/dashboard?page=buyTokens'}
                                            className="px-6 py-2 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 shadow-lg shadow-red-200"
                                        >
                                            {t.s2.buyTokens}
                                        </button>
                                    )}
                                </motion.div>
                            )}

                            {/* Tone Selector */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{t.s2.labelTone}</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {TONES.map(tone => (
                                        <button
                                            key={tone.id}
                                            type="button"
                                            onClick={() => setSelectedTone(tone.id)}
                                            className={`relative group p-5 rounded-3xl border-2 transition-all duration-300 ${selectedTone === tone.id
                                                ? 'border-purple-600 bg-white shadow-xl shadow-purple-500/10'
                                                : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <span className={`text-3xl transition-transform duration-500 ${selectedTone === tone.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tone.icon}</span>
                                                <span className={`font-black text-[10px] uppercase tracking-widest ${selectedTone === tone.id ? 'text-purple-700' : 'text-slate-400'}`}>
                                                    {lang === 'ro' ? tone.labelRo : tone.labelEn}
                                                </span>
                                            </div>
                                            {selectedTone === tone.id && (
                                                <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                                                    <div className="h-1.5 w-1.5 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Product Description */}
                            <div className="space-y-4">
                                <label htmlFor={'description'} className="text-xs font-black text-slate-400 uppercase tracking-widest block">{t.s2.labelDesc}</label>
                                <textarea
                                    id={'description'}
                                    rows={5}
                                    placeholder={lang === 'ro' ? "Ex: Descrie importanța acestui proiect de voluntariat..." : "Ex: Describe the importance of this volunteering project..."}
                                    className="block w-full rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white p-6 text-base font-medium text-slate-900 shadow-sm focus:border-purple-600 focus:ring-4 focus:ring-purple-600/5 transition-all outline-none resize-none placeholder:text-slate-300"
                                    value={formData.productDesc}
                                    onChange={(e) => setFormData({ ...formData, productDesc: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-between items-center pt-8">
                                <button type={'button'} onClick={() => setCurrentStep(1)} className="px-8 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-300 border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50">{t.s2.btnBack}</button>
                                <button
                                    type={'button'}
                                    onClick={handleGenerateAI}
                                    disabled={isLoading || !formData.productDesc || !hasEnoughTokens}
                                    className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl hover:bg-black hover:shadow-2xl hover:shadow-slate-900/20 disabled:opacity-30 transition-all font-black text-sm uppercase tracking-widest min-w-[240px] justify-center"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>{t.loading[loadingMsgIndex]}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span>{t.s2.btnGen}</span>
                                            <Sparkles size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3 - Targeting */}
                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800">{t.s3.title}</h2>
                                <p className="text-slate-500 text-lg">{t.s3.sub}</p>
                            </div>

                            <SimpleTargetingSelector
                                value={targetingData}
                                onChange={setTargetingData}
                                lang={lang as 'ro' | 'en'}
                            />

                            <div className="flex justify-between pt-8 border-t border-slate-100">
                                <button type={'button'} onClick={() => setCurrentStep(2)} className="px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border shadow-sm focus:outline-none active:scale-95 !bg-white border-slate-200 !text-slate-500 hover:!border-purple-400 hover:!text-purple-600 hover:shadow-md">{t.s2.btnBack}</button>
                                <button type={'button'} onClick={() => setCurrentStep(4)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-xl hover:shadow-xl font-bold min-w-[200px] justify-center">
                                    {t.s3.btnNext} <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4 - Video Selection */}
                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-800 mb-2">{t.s4.title}</h2>
                                        <p className="text-slate-500 text-base">{t.s2.selectVariant}</p>
                                    </div>
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                    >
                                        <RefreshCw size={16} />
                                        {t.s2.regenerate}
                                    </button>
                                </div>

                                {/* Script Variants */}
                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                                    {scriptVariants.map((script, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSelectVariant(index)}
                                            className={`text-left p-4 rounded-xl border-2 transition-all ${selectedVariantIndex === index
                                                ? 'border-purple-500 bg-purple-50/50 shadow-md'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedVariantIndex === index ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400 uppercase">{t.s2.variant} {index + 1}</span>
                                                {selectedVariantIndex === index && (
                                                    <CheckCircle2 className="w-4 h-4 text-purple-600 ml-auto" />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-700 line-clamp-3">{script}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* VIDEO SECTION */}
                                <div className="pt-6 border-t border-slate-100">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Video className="w-6 h-6 text-purple-600" />
                                        Video Creative
                                    </h3>

                                    {/* Video Mode Toggle */}
                                    <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setVideoMode('create')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${videoMode === 'create' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Sparkles className="w-4 h-4 inline mr-2" />
                                            Generate New
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVideoMode('select')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${videoMode === 'select' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Play className="w-4 h-4 inline mr-2" />
                                            Select from Gallery
                                        </button>
                                    </div>

                                    {/* Selected Video Preview */}
                                    {selectedVideo && (
                                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-center gap-4">
                                            <div className="w-24 aspect-[9/16] bg-black rounded-lg overflow-hidden relative">
                                                {selectedVideo.thumbnail_url ? (
                                                    <img src={selectedVideo.thumbnail_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-800" />
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <CheckCircle2 className="w-6 h-6 text-green-500 bg-white rounded-full" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800">Video Selectat</h4>
                                                <p className="text-sm text-slate-600 line-clamp-1">{selectedVideo.prompt}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">{selectedVideo.duration}s</span>
                                                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">{selectedVideo.quality}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedVideo(null); setFormData(p => ({ ...p, videoId: undefined })); }}
                                                className="p-2 hover:bg-purple-100 rounded-full text-purple-700"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    )}

                                    {!selectedVideo && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                            {videoMode === 'create' ? (
                                                <VideoGenerator
                                                    prompt={formData.klingPrompt || formData.aiScript.slice(0, 200)}
                                                    script={formData.aiScript}
                                                    userCredits={tokenBalance}
                                                    onCreditsUsed={(amount) => setTokenBalance(prev => prev - amount)}
                                                    onVideoGenerated={handleVideoGeneratedFromComponent}
                                                    onGeneratingChange={setIsVideoGenerating}
                                                />
                                            ) : (
                                                <VideoGallery
                                                    onVideoSelect={handleVideoSelected}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between pt-8 mt-6 border-t border-slate-100">
                                <button
                                    type={'button'}
                                    onClick={() => setCurrentStep(3)}
                                    disabled={isVideoGenerating}
                                    className={`px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border shadow-sm focus:outline-none active:scale-95 !bg-white border-slate-200 !text-slate-500 hover:!border-purple-400 hover:!text-purple-600 hover:shadow-md ${isVideoGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {t.s2.btnBack}
                                </button>
                                <button
                                    type={'button'}
                                    onClick={() => setCurrentStep(5)}
                                    disabled={isVideoGenerating}
                                    className={`flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-xl hover:shadow-xl font-bold min-w-[200px] justify-center ${isVideoGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isVideoGenerating ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Se generează...
                                        </>
                                    ) : (
                                        <>
                                            {t.s4.btnNext} <ChevronRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 5 - Review Final */}
                    {currentStep === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                            <CreditCard size={20} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.s1.labelBudget}</h4>
                                        <p className="text-2xl font-black text-slate-900 tabular-nums">{formData.budget} <span className="text-[10px] text-purple-400">{t.s1.tokensPerDay}</span></p>
                                        <p className="text-xs font-bold text-green-600 mt-1">~{Math.round(formData.budget * 100).toLocaleString()} 👀</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                            <Video size={20} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.s5.labelVideo}</h4>
                                        {selectedVideo ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-14 bg-black rounded-lg overflow-hidden flex-shrink-0">
                                                    {selectedVideo.thumbnail_url && <img src={selectedVideo.thumbnail_url} className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-[10px] text-slate-900 uppercase truncate">{selectedVideo.prompt || 'Custom Video'}</p>
                                                    <span className="text-[9px] font-black text-indigo-500 uppercase">{selectedVideo.duration}s</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-bold text-red-400">{t.s5.noVideo}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                                            <Users size={20} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.s5.labelTargeting}</h4>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-900 uppercase truncate">{targetingData.countries?.join(', ')}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{targetingData.ageGroups?.length === 5 ? 'All ages' : targetingData.ageGroups?.length + ' groups'} • {targetingData.gender?.replace('GENDER_', '')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Phone Mockup Preview */}
                            {selectedVideo && selectedVideo.video_url && (
                                <div className="flex justify-center">
                                    <div className="relative" style={{ maxWidth: '240px' }}>
                                        {/* Phone Frame */}
                                        <div className="relative bg-slate-900 rounded-[2.5rem] p-1.5 shadow-2xl shadow-slate-900/50">
                                            {/* Notch */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-xl z-20" />

                                            {/* Screen */}
                                            <div className="relative bg-black rounded-[2rem] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
                                                {/* Status Bar */}
                                                <div className="absolute top-0 left-0 right-0 z-10 px-5 pt-1.5 flex items-center justify-between text-white text-[9px] font-semibold">
                                                    <span>9:41</span>
                                                    <div className="flex items-center gap-1">
                                                        <Signal size={10} />
                                                        <Wifi size={10} />
                                                        <Battery size={10} />
                                                    </div>
                                                </div>

                                                {/* Video */}
                                                <video
                                                    ref={videoRef}
                                                    src={selectedVideo.video_url}
                                                    className="w-full h-full object-cover cursor-pointer"
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                    onClick={() => {
                                                        if (videoRef.current) {
                                                            if (isVideoPlaying) {
                                                                videoRef.current.pause();
                                                            } else {
                                                                videoRef.current.play();
                                                            }
                                                            setIsVideoPlaying(!isVideoPlaying);
                                                        }
                                                    }}
                                                />

                                                {/* Pause indicator */}
                                                {!isVideoPlaying && (
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                                                            <Play size={24} className="text-white ml-1" fill="white" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TikTok Overlay */}
                                                <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 text-white">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                                            <Heart size={14} fill="white" />
                                                        </div>
                                                        <span className="text-[8px] font-bold mt-0.5">12.5K</span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                                            <MessageCircle size={14} />
                                                        </div>
                                                        <span className="text-[8px] font-bold mt-0.5">342</span>
                                                    </div>
                                                </div>

                                                {/* Bottom info */}
                                                <div className="absolute bottom-3 left-2 right-12 text-white">
                                                    <p className="font-bold text-[10px]">@campaia_ads</p>
                                                    <p className="text-[8px] opacity-80 mt-0.5 line-clamp-2">{formData.aiScript?.slice(0, 40)}...</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Music size={8} />
                                                        <span className="text-[7px] font-medium">Sound</span>
                                                    </div>
                                                </div>

                                                {/* Sponsored */}
                                                <div className="absolute top-10 left-2">
                                                    <span className="text-[7px] font-bold text-white bg-white/20 backdrop-blur px-1.5 py-0.5 rounded">Sponsored</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Home indicator */}
                                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/50 rounded-full" />
                                    </div>
                                </div>
                            )}

                            {/* Script Review */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Script Video TikTok</label>
                                <div className="bg-slate-50/50 rounded-3xl p-8 border-2 border-slate-50 relative">
                                    <div className="absolute -top-4 left-6 px-4 py-1 bg-white border border-slate-100 rounded-full">
                                        <Sparkles size={12} className="text-purple-600" />
                                    </div>
                                    <p className="text-slate-700 font-medium italic leading-relaxed whitespace-pre-wrap">"{formData.aiScript}"</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-10">
                                <button type={'button'} onClick={() => setCurrentStep(4)} className="px-8 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-300 border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50">{t.s2.btnBack}</button>
                                <button
                                    type={'button'}
                                    onClick={handlePublishClick}
                                    disabled={isPublishing}
                                    className="flex items-center gap-4 bg-green-600 text-white px-12 py-5 rounded-2xl hover:bg-green-700 hover:shadow-2xl hover:shadow-green-500/20 disabled:opacity-30 transition-all font-black text-sm uppercase tracking-widest min-w-[280px] justify-center active:scale-95"
                                >
                                    {isPublishing ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            <span>{t.s5.btnPub}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}