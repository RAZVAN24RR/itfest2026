import { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft,
    Save,
    Trash2,
    Play,
    Pause,
    ExternalLink,
    Sparkles,
    Smartphone,
    Link as LinkIcon,
    AlertCircle,
    Loader2,
    Users,
    CheckCircle2,
    Lock,
    Globe,
    Upload,
    Zap,
    Wifi,
    Battery,
    Signal,
    Heart,
    MessageCircle,
    Share2,
    Music,
    X,
    Video
} from 'lucide-react';
import campaignService, { type Campaign, CampaignStatus } from '../../services/campaignService';
import targetingService, { type AudienceTarget } from '../../services/targetingService';
import videoService, { type VideoListItem } from '../../services/videoService';
import tiktokService from '../../services/tiktokService';
import SimpleTargetingSelector, { TIKTOK_COUNTRIES, TIKTOK_AGE_GROUPS, TIKTOK_GENDERS, toTikTokTargeting } from '../../components/targeting/SimpleTargetingSelector';
import VideoGallery from '../../components/VideoGallery';

interface CampaignDetailsProps {
    campaignId: string;
    onBack: () => void;
    onDeleted: () => void;
    lang: string;
}

export default function CampaignDetails({ campaignId, onBack, onDeleted, lang }: CampaignDetailsProps) {
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showGalleryModal, setShowGalleryModal] = useState(false);

    // Editable state
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [budget, setBudget] = useState(0);
    const [targeting, setTargeting] = useState<Partial<AudienceTarget> | null>(null);
    const [video, setVideo] = useState<VideoListItem | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const t = {
        ro: {
            back: "Înapoi",
            save: "Salvează Modificările",
            saving: "Se salvează...",
            delete: "Șterge Campania",
            status: "Status",
            details: "Detalii Campanie",
            creative: "Video Creativ",
            script: "Script AI",
            nameLabel: "Nume Campanie",
            urlLabel: "Link Destinație",
            budgetLabel: "Buget Zilnic (tokens)",
            active: "Activă",
            paused: "Pauză",
            relaunch: "Repornește",
            pause: "Pune pe pauză",
            viewOnTiktok: "Vezi pe TikTok",
            noVideo: "Niciun video asociat",
            error: "Eroare la încărcare",
            success: "Modificări salvate!",
            targetingLabel: "Targetare Audiență",
            budget: "Buget",
            spent: "Consumat",
            tokens: "tokens",
            tiktokPerformance: "Performanță TikTok",
            estReach: "Audiență Estimată",
            ageGroup: "Grupă de Vârstă",
            targetingShort: "Targetare",
            adId: "TikTok Ad ID",
            pending: "ÎN AȘTEPTARE",
            draft: "Draft",
            confirmDelete: "Ești sigur că vrei să ștergi această campanie?",
            all: "Toate",
            setNamePlaceholder: "Nume nesetat"
        },
        en: {
            back: "Back",
            save: "Save Changes",
            saving: "Saving...",
            delete: "Delete Campaign",
            status: "Status",
            details: "Campaign Details",
            creative: "Video Creative",
            script: "AI Script",
            nameLabel: "Campaign Name",
            urlLabel: "Destination Link",
            budgetLabel: "Daily Budget (tokens)",
            active: "Active",
            paused: "Paused",
            relaunch: "Resume",
            pause: "Pause",
            viewOnTiktok: "View on TikTok",
            noVideo: "No video associated",
            error: "Error loading campaign",
            success: "Changes saved!",
            targetingLabel: "Audience Targeting",
            budget: "Budget",
            spent: "Spent",
            tokens: "tokens",
            tiktokPerformance: "TikTok Performance",
            estReach: "Est. Reach",
            ageGroup: "Age Group",
            targetingShort: "Targeting",
            adId: "TikTok Ad ID",
            pending: "PENDING",
            draft: "Draft",
            confirmDelete: "Are you sure you want to delete this campaign?",
            all: "All",
            setNamePlaceholder: "Name not set"
        }
    }[lang === 'ro' ? 'ro' : 'en'];

    useEffect(() => {
        loadData();
    }, [campaignId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const c = await campaignService.getCampaign(campaignId);
            setCampaign(c);
            setName(c.name || '');
            setUrl(c.url || '');
            setBudget(c.budget);

            // Fetch Targeting
            try {
                const tData = await targetingService.getTargeting(campaignId);
                setTargeting(tData);

                // Set initial targeting for selector (if it's a draft)
                if (!c.tiktok_campaign_id && tData) {
                    // Map IDs back to country codes for the selector
                    const countryCodes = (tData.location_ids || tData.countries || ['642']).map((id: string) => {
                        const country = TIKTOK_COUNTRIES.find(c => c.id === id || c.code === id);
                        return country?.code || id;
                    });

                    setTargeting({
                        countries: countryCodes,
                        ageGroups: tData.age_groups || ['AGE_18_24', 'AGE_25_34'],
                        gender: tData.gender || 'GENDER_UNLIMITED',
                        city: c.city || undefined,
                        lat: c.lat || undefined,
                        lng: c.lng || undefined
                    } as any);
                } else if (tData) {
                    setTargeting({
                        ...tData,
                        city: c.city || undefined,
                        lat: c.lat || undefined,
                        lng: c.lng || undefined
                    });
                }
            } catch (err) {
                console.error("Failed to fetch targeting", err);
            }

            // Fetch Video Creator
            try {
                const vResponse = await videoService.getVideos(campaignId, 1, 0);
                if (vResponse.videos && vResponse.videos.length > 0) {
                    // Find the first completed video if possible
                    const completedVideo = vResponse.videos.find(v => v.status === 'COMPLETED');
                    setVideo(completedVideo || vResponse.videos[0]);
                } else if (c.video_url) {
                    // Fallback to campaign's video_url if list is empty
                    setVideo({
                        id: c.video_id || '',
                        video_url: c.video_url,
                        status: 'COMPLETED',
                        prompt: 'Campaign Video'
                    } as any);
                }
            } catch (err) {
                console.error("Failed to fetch campaign video", err);
            }
        } catch (err) {
            console.error(err);
            setError(t.error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setShowSuccess(false);
        try {
            await campaignService.updateCampaign(campaignId, {
                name,
                url,
                budget,
                city: (targeting as any)?.city,
                lat: (targeting as any)?.lat,
                lng: (targeting as any)?.lng
            });

            if (targeting && campaign && !campaign.tiktok_campaign_id) {
                // Adjust to the format expected by the backend
                const tiktokFormat = toTikTokTargeting(targeting as any);
                await targetingService.updateTargeting(campaignId, tiktokFormat);
            }

            // Show success notification
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            loadData();
        } catch (err) {
            console.error(err);
            setError("Failed to save changes");
            setShowSuccess(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!campaign) return;
        setIsLoading(true);
        try {
            if (campaign.status === CampaignStatus.ACTIVE) {
                await campaignService.pauseCampaign(campaignId);
            } else {
                await campaignService.resumeCampaign(campaignId);
            }
            loadData();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t.confirmDelete)) return;
        try {
            await campaignService.deleteCampaign(campaignId);
            onDeleted();
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading && !campaign) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (!campaign) return null;

    const isActive = campaign.status === CampaignStatus.ACTIVE;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span className="font-bold">{error}</span>
                </div>
            )}
            {showSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 size={20} />
                    <span className="font-bold">{t.success}</span>
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100 pb-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-all text-slate-500 shadow-sm hover:shadow-md active:scale-95"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Smartphone size={16} className="text-purple-600" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Campaign Hub</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{name}</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 self-start text-sm">
                            <LinkIcon size={14} className="text-purple-500" />
                            {campaign.url}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {campaign.tiktok_campaign_id && (
                        <button
                            onClick={handleToggleStatus}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isActive
                                ? 'bg-amber-50 text-amber-600 border border-amber-200 shadow-amber-500/10 hover:bg-amber-100'
                                : 'bg-green-600 text-white border border-green-700 shadow-green-500/20 hover:bg-green-700'
                                }`}
                        >
                            {isActive ? <><Pause size={20} fill="currentColor" /> {t.pause}</> : <><Play size={20} fill="currentColor" /> {t.relaunch}</>}
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="p-4 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-all bg-white shadow-sm hover:shadow-red-500/10"
                        title={t.delete}
                    >
                        <Trash2 size={24} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Editor & Stats */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <QuickStatDetail label={t.budget} value={campaign.budget.toString()} sub={t.tokens + " / zi"} color="bg-purple-500" />
                        <QuickStatDetail label={t.spent} value={campaign.tokens_spent.toString()} sub={t.tokens} color="bg-indigo-500" />
                        <QuickStatStatus
                            label={t.status}
                            status={campaign.status}
                            activeText={t.active}
                            pausedText={t.paused}
                            draftText={t.draft}
                        />
                        <QuickStatDetail label="Burn Rate" value={campaign.budget.toString()} sub={t.tokens + " / zi"} color="bg-orange-500" />
                    </div>

                    {/* Edit Form */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 space-y-8">
                        <div className="flex items-center gap-3 mb-2 p-2 bg-slate-50 self-start rounded-xl border border-slate-100">
                            <Smartphone size={20} className="text-purple-600" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{t.details}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">{t.nameLabel}</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-medium"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t.setNamePlaceholder}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">{t.urlLabel}</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-medium"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">{t.budgetLabel}</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="10"
                                        max="1000"
                                        step="10"
                                        className="flex-1 accent-purple-600"
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                    />
                                    <span className="bg-purple-50 px-3 py-1.5 rounded-lg text-purple-700 font-bold min-w-[60px] text-center border border-purple-100">
                                        {budget}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {isSaving ? t.saving : t.save}
                            </button>
                        </div>
                    </div>

                    {/* Targeting Section */}
                    {targeting && (
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <Users size={20} className="text-purple-600" />
                                    <h3 className="text-xl font-bold">{t.targetingLabel}</h3>
                                </div>
                                {!campaign.tiktok_campaign_id ? (
                                    <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                                        <Sparkles size={14} className="animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{lang === 'ro' ? 'Editabil' : 'Editable'}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                                        <Lock size={14} />
                                        <span className="text-xs font-bold font-mono">Read-only</span>
                                    </div>
                                )}
                            </div>

                            {!campaign.tiktok_campaign_id ? (
                                <SimpleTargetingSelector
                                    lang={lang as 'ro' | 'en'}
                                    value={targeting as any}
                                    onChange={(newData) => setTargeting(newData as any)}
                                />
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-amber-800 text-sm">
                                        <AlertCircle size={16} />
                                        <span>{lang === 'ro' ? 'Targetarea nu poate fi modificată după publicarea pe TikTok' : 'Targeting cannot be modified after publishing to TikTok'}</span>
                                    </div>

                                    {/* Countries Display */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Globe size={14} className="text-purple-600" />
                                            <span className="text-sm font-bold text-slate-600">{lang === 'ro' ? 'Țări' : 'Countries'}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {((targeting as any).location_ids || (targeting as any).countries || ['RO']).map((id: string) => {
                                                const country = TIKTOK_COUNTRIES.find(c => c.id === id || c.code === id);
                                                return (
                                                    <span key={id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium">
                                                        <span>{country?.flag || '🌍'}</span>
                                                        <span>{country ? (lang === 'ro' ? country.name : country.nameEn) : id}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Age Groups Display */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-blue-600" />
                                            <span className="text-sm font-bold text-slate-600">{lang === 'ro' ? 'Grupe de Vârstă' : 'Age Groups'}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {((targeting as any).age_groups || ['AGE_18_24', 'AGE_25_34']).map((id: string) => {
                                                const age = TIKTOK_AGE_GROUPS.find(a => a.id === id);
                                                return (
                                                    <span key={id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold">
                                                        <span>{age?.emoji || '👤'}</span>
                                                        <span>{age ? (lang === 'ro' ? age.label : age.labelEn) : id}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Gender Display */}
                                    <div className="space-y-3">
                                        <span className="text-sm font-bold text-slate-600">{lang === 'ro' ? 'Gen' : 'Gender'}</span>
                                        <div>
                                            {(() => {
                                                const genderId = (targeting as any).gender || 'GENDER_UNLIMITED';
                                                const gender = TIKTOK_GENDERS.find(g => g.id === genderId);
                                                return (
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 font-bold">
                                                        <span>{gender?.icon || '👥'}</span>
                                                        <span>{gender ? (lang === 'ro' ? gender.label : gender.labelEn) : genderId}</span>
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Script Section */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-slate-800">
                            <Sparkles size={20} className="text-purple-600" />
                            <h3 className="text-xl font-bold">{t.script}</h3>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 italic leading-relaxed whitespace-pre-wrap">
                            "{campaign.ai_script}"
                        </div>
                    </div>
                </div>

                {/* Right Column: Phone Preview & Publish */}
                <div className="space-y-6">
                    {/* TikTok Phone Mockup */}
                    <div className="relative mx-auto" style={{ maxWidth: '280px' }}>
                        {/* Phone Frame */}
                        <div className="relative bg-slate-900 rounded-[3rem] p-2 shadow-2xl shadow-slate-900/50">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />

                            {/* Screen */}
                            <div className="relative bg-black rounded-[2.5rem] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
                                {/* Status Bar */}
                                <div className="absolute top-0 left-0 right-0 z-10 px-6 pt-2 flex items-center justify-between text-white text-[10px] font-semibold">
                                    <span>9:41</span>
                                    <div className="flex items-center gap-1">
                                        <Signal size={12} />
                                        <Wifi size={12} />
                                        <Battery size={12} />
                                    </div>
                                </div>

                                {/* Video Content */}
                                {video && video.video_url ? (
                                    <video
                                        ref={videoRef}
                                        src={video.video_url}
                                        className="w-full h-full object-cover cursor-pointer"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        poster={video.thumbnail_url || undefined}
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
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white/30 p-6 text-center">
                                        <Smartphone size={48} className="mb-3" />
                                        <p className="text-xs font-medium mb-4">{t.noVideo}</p>
                                        {!campaign.tiktok_campaign_id && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowGalleryModal(true);
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
                                            >
                                                {lang === 'ro' ? 'Alege un video / Generează' : 'Choose a video'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* TikTok Overlay UI */}
                                {video && video.video_url && (
                                    <>
                                        {/* Pause indicator */}
                                        {!isVideoPlaying && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                                                    <Play size={32} className="text-white ml-1" fill="white" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Right side actions */}
                                        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-white">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                                    <Heart size={20} fill="white" />
                                                </div>
                                                <span className="text-[10px] font-bold mt-1">12.5K</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                                    <MessageCircle size={20} />
                                                </div>
                                                <span className="text-[10px] font-bold mt-1">342</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                                    <Share2 size={20} />
                                                </div>
                                                <span className="text-[10px] font-bold mt-1">Share</span>
                                            </div>
                                        </div>

                                        {/* Bottom info */}
                                        <div className="absolute bottom-4 left-3 right-16 text-white">
                                            <p className="font-bold text-sm">@campaia_ads</p>
                                            <p className="text-xs opacity-80 mt-1 line-clamp-2">{campaign.ai_script?.slice(0, 60)}...</p>
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <Music size={10} />
                                                <span className="text-[10px] font-medium">Original Sound</span>
                                            </div>
                                        </div>

                                        {/* Sponsored tag */}
                                        <div className="absolute top-12 left-3">
                                            <span className="text-[9px] font-bold text-white bg-white/20 backdrop-blur px-2 py-1 rounded">Sponsored</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Home indicator */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/50 rounded-full" />
                    </div>

                    {/* Change Video Button */}
                    {video && video.video_url && !campaign.tiktok_campaign_id && (
                        <button
                            onClick={() => setShowGalleryModal(true)}
                            className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <Video size={18} className="text-purple-600" />
                            {lang === 'ro' ? 'Schimbă Videoclipul' : 'Change Video'}
                        </button>
                    )}

                    {/* Publish to TikTok Button */}
                    {!campaign.tiktok_campaign_id ? (
                        <div className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[2px] rounded-2xl shadow-xl shadow-pink-500/30">
                            <button
                                onClick={async () => {
                                    setIsPublishing(true);
                                    try {
                                        setIsPublishing(true);
                                        const result = await tiktokService.publishCampaign(campaignId);
                                        if (result.success) {
                                            // Refresh campaign data
                                            const updated = await campaignService.getCampaign(campaignId);
                                            setCampaign(updated);
                                        } else {
                                            alert(lang === 'ro'
                                                ? `Publicarea a eșuat: ${result.error}`
                                                : `Publishing failed: ${result.error}`);
                                        }
                                    } catch (err: any) {
                                        console.error('TikTok publish error:', err);
                                        alert(lang === 'ro'
                                            ? 'Eroare la comunicarea cu serverul.'
                                            : 'Error communicating with the server.');
                                    } finally {
                                        setIsPublishing(false);
                                    }
                                }}
                                disabled={isPublishing || !video}
                                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                            >
                                {isPublishing ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        {lang === 'ro' ? 'Se publică...' : 'Publishing...'}
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        <span>{lang === 'ro' ? 'Publică pe TikTok' : 'Publish to TikTok'}</span>
                                        <Zap size={16} className="text-yellow-400" />
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-green-600 font-bold mb-2">
                                <CheckCircle2 size={20} />
                                <span>{lang === 'ro' ? 'Publicat pe TikTok' : 'Published on TikTok'}</span>
                            </div>
                            <p className="text-xs text-green-600/70 font-mono">{campaign.tiktok_campaign_id}</p>
                            <button
                                className="mt-3 w-full py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all text-sm"
                                onClick={() => window.open('https://ads.tiktok.com', '_blank')}
                            >
                                <ExternalLink size={16} />
                                {t.viewOnTiktok}
                            </button>
                        </div>
                    )}

                    {/* TikTok Ad ID Info */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 font-medium">{t.adId}</span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 text-xs">
                                {campaign.tiktok_ad_id || t.pending}
                            </span>
                        </div>
                    </div>

                    {/* Coming Soon Platforms */}
                    <div className="space-y-3 mt-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{lang === 'ro' ? 'Alte Platforme' : 'Other Platforms'}</p>
                        <div className="bg-white border border-blue-100 rounded-2xl p-4 flex items-center gap-4 opacity-60">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">📘</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-900">Meta Ads</p>
                                <p className="text-[10px] text-slate-400">Facebook, Instagram, Reels</p>
                            </div>
                            <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-amber-100 flex-shrink-0">Soon</span>
                        </div>
                        <div className="bg-white border border-green-100 rounded-2xl p-4 flex items-center gap-4 opacity-60">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">🔍</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-900">Google Ads</p>
                                <p className="text-[10px] text-slate-400">YouTube, Search, Display</p>
                            </div>
                            <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-amber-100 flex-shrink-0">Soon</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Modal */}
            {showGalleryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl animate-in fade-in slide-in-from-bottom-8">
                        <button
                            onClick={() => setShowGalleryModal(false)}
                            className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors z-10"
                        >
                            <X size={20} />
                        </button>
                        <div className="mb-2">
                            <h2 className="text-2xl font-black text-slate-900">
                                {lang === 'ro' ? 'Colecția ta de clipuri' : 'Your video collection'}
                            </h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {lang === 'ro' ? 'Alege un video din listă sau generează unul nou din meniul principal de Clipuri, apoi întoarce-te aici.' : 'Choose a video from the list or generate a new one from the main Videos menu, then return here.'}
                            </p>
                        </div>
                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <VideoGallery
                                onVideoSelect={async (selectedVideo) => {
                                    try {
                                        setIsSaving(true);
                                        await campaignService.updateCampaign(campaignId, {
                                            video_id: selectedVideo.id,
                                            video_url: selectedVideo.video_url
                                        } as any);
                                        setShowGalleryModal(false);
                                        loadData();
                                    } catch (err) {
                                        console.error(err);
                                        alert(lang === 'ro' ? 'Eroare la asocierea videoclipului.' : 'Error attaching video.');
                                        setIsSaving(false);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function QuickStatDetail({ label, value, sub, color }: { label: string, value: string, sub?: string, color: string }) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-500">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 bg-slate-50 opacity-40 group-hover:scale-110 transition-transform duration-500`}></div>
            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-2 h-2 rounded-full ${color}`}></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{value}</span>
                    {sub && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{sub}</span>}
                </div>
            </div>
        </div>
    );
}

function QuickStatStatus({ label, status, activeText, pausedText, draftText }: { label: string, status: string, activeText: string, pausedText: string, draftText: string }) {
    const isActive = status === 'ACTIVE';
    const isPaused = status === 'PAUSED';
    const isDraft = status === 'DRAFT';

    let color = "bg-slate-300";
    if (isActive) color = "bg-green-500";
    if (isPaused) color = "bg-amber-500";
    if (isDraft) color = "bg-blue-400";

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-500">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 bg-slate-50 opacity-40 group-hover:scale-110 transition-transform duration-500`}></div>
            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-2 h-2 rounded-full ${color}`}></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isActive ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' :
                        isPaused ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                            isDraft ? 'bg-blue-400 text-white shadow-lg shadow-blue-500/20' :
                                'bg-slate-200 text-slate-500'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
                        {isActive ? activeText : isPaused ? pausedText : isDraft ? draftText : status}
                    </span>
                </div>
            </div>
        </div>
    );
}
