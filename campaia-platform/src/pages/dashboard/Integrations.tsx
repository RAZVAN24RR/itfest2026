
import { useState, useEffect } from 'react';
import { Share2, AlertCircle, ExternalLink, RefreshCw, ShieldCheck, Activity, Search, Box, TrendingUp, Users, MousePointer2, Target, BarChart3, Clock, Rocket } from 'lucide-react';
import tiktokService, { type TikTokStatus } from '../../services/tiktokService';
import { useLanguage } from '../../context/LanguageContext';

export default function Integrations() {
    const { language } = useLanguage();
    const [status, setStatus] = useState<TikTokStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tiktokCampaigns, setTiktokCampaigns] = useState<any[]>([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
    /** false = user not allowed (403) or failed; true = loaded */
    const [metricsVisible, setMetricsVisible] = useState(true);

    const t = {
        ro: {
            title: "Integrations Hub",
            sub: "Gestionează integrările tale cu platformele de publicitate.",
            tiktok: "TikTok Ads Master",
            tiktok_sub: "Contul centralizat de publicare.",
            connected: "Conectat",
            disconnected: "Neconectat",
            environment: "Mediu",
            advertiser: "Cont Publicitar",
            balance: "Credit Disponibil",
            status: "Status Cont",
            refresh: "Reîmprospătează",
            view_ads: "Vezi TikTok Ads Manager",
            credentials_missing: "Credențialele TikTok lipseasc din config.",
            sandbox_explorer: "Campaign Explorer",
            sandbox_sub: "Campanii active în Sandbox.",
            publish_checklist: "Checklist publicare Sandbox",
            publish_steps: "1) Credențiale TikTok în .env · 2) Campanie cu video (URL public) · 3) Campaign Details → Publică pe TikTok · 4) Verifică în Ads Manager",
            metrics_locked: "Metrici globale doar pentru conturi admin (vezi TIKTOK_METRICS_ADMIN_EMAILS).",
            no_campaigns: "Nu am găsit campanii.",
            metrics_title: "Performanță Globală (30 zile)",
            spend: "Cheltuit",
            impressions: "Afisări",
            clicks: "Click-uri",
            conversions: "Conversii",
            ctr: "CTR",
            cpc: "CPC"
        },
        en: {
            title: "Integrations Hub",
            sub: "Manage your advertising platform integrations.",
            tiktok: "TikTok Ads Master",
            tiktok_sub: "Centralized publishing account.",
            connected: "Connected",
            disconnected: "Disconnected",
            environment: "Environment",
            advertiser: "Ads Account",
            balance: "Available Balance",
            status: "Account Status",
            refresh: "Refresh",
            view_ads: "View TikTok Ads Manager",
            credentials_missing: "TikTok credentials missing from config.",
            sandbox_explorer: "Campaign Explorer",
            sandbox_sub: "Active sessions in Sandbox.",
            publish_checklist: "Sandbox publish checklist",
            publish_steps: "1) TikTok creds in .env · 2) Campaign with video (public URL) · 3) Campaign Details → Publish to TikTok · 4) Confirm in Ads Manager",
            metrics_locked: "Global metrics only for admin emails (TIKTOK_METRICS_ADMIN_EMAILS).",
            no_campaigns: "No campaigns found.",
            metrics_title: "Global Performance (30 days)",
            spend: "Spent",
            impressions: "Impressions",
            clicks: "Clicks",
            conversions: "Conversions",
            ctr: "CTR",
            cpc: "CPC"
        }
    }[language];

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await tiktokService.getStatus();
            setStatus(data);
            if (data.connected) {
                fetchTikTokCampaigns();
                fetchMetrics();
            }
        } catch (err: any) {
            console.error('Failed to fetch TikTok status:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTikTokCampaigns = async () => {
        try {
            setIsLoadingCampaigns(true);
            const data = await tiktokService.getCampaigns();
            setTiktokCampaigns(data.list || []);
        } catch (err) {
            console.error('Failed to fetch TikTok campaigns:', err);
        } finally {
            setIsLoadingCampaigns(false);
        }
    };

    const fetchMetrics = async () => {
        try {
            setIsLoadingMetrics(true);
            setMetricsVisible(true);
            const data = await tiktokService.getMetrics(30);
            if (data.list && data.list.length > 0) {
                setMetrics(data.list[0].metrics);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '';
            if (msg.includes('Only admin') || msg.includes('403')) {
                setMetricsVisible(false);
            } else {
                console.error('Failed to fetch TikTok metrics:', err);
            }
        } finally {
            setIsLoadingMetrics(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const calculateCTR = (clicks: string, imps: string) => {
        if (!imps || imps === '0') return '0%';
        return ((parseFloat(clicks) / parseFloat(imps)) * 100).toFixed(2) + '%';
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.title}</h2>
                    <p className="text-slate-500 font-medium mt-1">{t.sub}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-2xl border border-emerald-200 flex items-center gap-2">
                        <Rocket size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">{t.publish_checklist}</span>
                    </div>
                    <div className="bg-amber-100/50 text-amber-700 px-4 py-2 rounded-2xl border border-amber-200 flex items-center gap-2">
                        <ShieldCheck size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">TikTok metrics · admin</span>
                    </div>
                </div>
            </div>

            <p className="text-sm text-slate-600 font-medium bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4">{t.publish_steps}</p>

            {/* Metrics Grid — only if API allows (admin) */}
            {metricsVisible ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <MetricCard icon={<TrendingUp size={24} />} label={t.spend} value={`${metrics?.spend || '0.00'}`} sub={status?.currency || 'EUR'} color="text-emerald-600" bg="bg-emerald-50" />
                    <MetricCard icon={<Users size={24} />} label={t.impressions} value={`${metrics?.impressions || '0'}`} color="text-blue-600" bg="bg-blue-50" />
                    <MetricCard icon={<MousePointer2 size={24} />} label={t.clicks} value={`${metrics?.clicks || '0'}`} color="text-purple-600" bg="bg-purple-50" />
                    <MetricCard icon={<BarChart3 size={24} />} label={t.ctr} value={calculateCTR(metrics?.clicks, metrics?.impressions)} color="text-indigo-600" bg="bg-indigo-50" />
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-600 font-medium">
                    {t.metrics_locked}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Account Status & Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden group h-full">
                        <div className="p-8">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                                    <Share2 size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{t.tiktok}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {status?.connected ? (
                                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{t.connected}</span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.disconnected}</span>
                                        )}
                                        <div className={`w-1.5 h-1.5 rounded-full ${status?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                    </div>
                                </div>
                            </div>

                            {status?.connected ? (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.advertiser}</p>
                                        <p className="text-sm font-black text-slate-900">{status.advertiser_name}</p>
                                        <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {status.advertiser_id}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.environment}</p>
                                            <p className="text-sm font-black text-slate-700 uppercase">{status.environment}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.status}</p>
                                            <p className="text-sm font-black text-slate-700">{status.status}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-3">
                                        <a href="https://ads.tiktok.com/" target="_blank" rel="noopener noreferrer" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 flex items-center justify-center gap-3 hover:bg-black transition-all font-black text-xs uppercase tracking-widest">
                                            <ExternalLink size={16} />
                                            {t.view_ads}
                                        </a>
                                        <button onClick={fetchData} className="w-full bg-white border border-slate-100 text-slate-900 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest">
                                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                                            {t.refresh}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 text-center">
                                    <AlertCircle className="mx-auto text-amber-500 mb-4" size={32} />
                                    <p className="text-sm font-black text-amber-900">{t.credentials_missing}</p>
                                    <button onClick={fetchData} className="mt-4 w-full bg-white text-slate-900 rounded-xl py-3 text-xs font-black uppercase">Try Reconnect</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Campaign Explorer */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-full">
                        <div className="p-8 sm:p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Box size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{t.sandbox_explorer}</h3>
                                        <p className="text-xs font-medium text-slate-400">{t.sandbox_sub}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-tighter">{tiktokCampaigns.length} campaigns</span>
                                    <button onClick={fetchTikTokCampaigns} disabled={isLoadingCampaigns} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                        <RefreshCw size={18} className={isLoadingCampaigns ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            {isLoadingCampaigns ? (
                                <SkeletonList />
                            ) : tiktokCampaigns.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {tiktokCampaigns.map((camp: any) => (
                                        <div key={camp.campaign_id} className="group bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 border border-slate-100 rounded-2xl p-4 transition-all duration-300">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${camp.operation_status === 'ENABLE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                                        <Target size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 leading-tight">{camp.campaign_name}</p>
                                                        <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">ID: {camp.campaign_id} • {camp.objective_type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-900">{camp.budget} {status?.currency}</p>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md mt-1 inline-block ${camp.operation_status === 'ENABLE' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                        {camp.operation_status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                                        <Search size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">{t.no_campaigns}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Coming Soon Platforms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meta Ads - Coming Soon */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-125 transition-transform duration-500" />
                    <div className="p-8">
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-xl shadow-blue-600/20">
                                📘
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Meta Ads</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-1.5">
                                        <Clock size={10} />
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                            {language === 'ro'
                                ? 'Publică campanii direct pe Facebook și Instagram. Targetare avansată pe baza intereselor, demograficelor și comportamentului utilizatorilor din ecosistemul Meta.'
                                : 'Publish campaigns directly on Facebook and Instagram. Advanced targeting based on interests, demographics, and user behavior across the Meta ecosystem.'
                            }
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full uppercase tracking-widest">Facebook</span>
                            <span className="text-[9px] font-black bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full uppercase tracking-widest">Instagram</span>
                            <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full uppercase tracking-widest">Reels</span>
                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full uppercase tracking-widest">Stories</span>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-4 border border-amber-100">
                                <Rocket size={18} className="text-amber-600 flex-shrink-0" />
                                <p className="text-xs font-bold text-amber-800">
                                    {language === 'ro'
                                        ? 'Estimat: Q3 2026 — Integrare completă cu Meta Business Suite'
                                        : 'Estimated: Q3 2026 — Full Meta Business Suite integration'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Google Ads - Coming Soon */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-green-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-125 transition-transform duration-500" />
                    <div className="p-8">
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-xl shadow-green-500/20">
                                🔍
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Google Ads</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-1.5">
                                        <Clock size={10} />
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                            {language === 'ro'
                                ? 'Extinde reach-ul campaniilor tale pe YouTube, Google Search și Display Network. Video ads generat de AI, optimizat automat pentru fiecare placement.'
                                : 'Extend your campaign reach across YouTube, Google Search, and the Display Network. AI-generated video ads automatically optimized for each placement.'
                            }
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-[9px] font-black bg-red-50 text-red-600 px-3 py-1.5 rounded-full uppercase tracking-widest">YouTube</span>
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full uppercase tracking-widest">Search</span>
                            <span className="text-[9px] font-black bg-green-50 text-green-600 px-3 py-1.5 rounded-full uppercase tracking-widest">Display</span>
                            <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full uppercase tracking-widest">Shopping</span>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-4 border border-amber-100">
                                <Rocket size={18} className="text-amber-600 flex-shrink-0" />
                                <p className="text-xs font-bold text-amber-800">
                                    {language === 'ro'
                                        ? 'Estimat: Q4 2026 — YouTube Ads, Search & Display Network'
                                        : 'Estimated: Q4 2026 — YouTube Ads, Search & Display Network'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, sub, color, bg }: { icon: any, label: string, value: string, sub?: string, color: string, bg: string }) {
    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className={`absolute -top-4 -right-4 w-20 h-20 ${bg} rounded-full opacity-40 group-hover:scale-125 transition-transform duration-500`} />
            <div className="relative">
                <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-4`}>
                    {icon}
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
                    {sub && <span className="text-[10px] font-black text-slate-400 uppercase">{sub}</span>}
                </div>
            </div>
        </div>
    );
}

function SkeletonList() {
    return (
        <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-50 h-20 rounded-2xl" />
            ))}
        </div>
    );
}

