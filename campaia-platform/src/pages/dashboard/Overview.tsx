import { PlusCircle, Smartphone, Trash2, ArrowRight, Pause, Play, Loader2, Link } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import type OverviewProps from "../../interfaces/overviewProps.ts";

export default function Overview({ campaigns, onCreateNew, lang, onDelete, onToggle, onView }: OverviewProps) {
    const texts = {
        ro: {
            title: "Planșă de Bord",
            subtitle: "Monitorizează și optimizează campaniile tale în timp real.",
            emptyTitle: "Încă nu ai lansat nicio campanie",
            emptyDesc: "Transformă proiectele comunității în povești virale. Prima ta campanie este la doar câteva click-uri distanță.",
            btn: "Lansează Prima Campanie",
            newBtn: "Campanie Nouă",
            viewBtn: "Vezi Detalii"
        },
        en: {
            title: "Command Center",
            subtitle: "Track and optimize your campaigns in real-time.",
            emptyTitle: "No campaigns launched yet",
            emptyDesc: "Turn your products into viral stories. Your first campaign is just a few clicks away.",
            btn: "Launch First Campaign",
            newBtn: "New Campaign",
            viewBtn: "View Details"
        }
    };

    const t = lang === 'ro' ? texts.ro : texts.en;

    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    const handleAction = async (id: string, action: (id: string) => Promise<void>) => {
        if (processingIds.has(id)) return;
        setProcessingIds(prev => new Set(prev).add(id));
        try {
            await action(id);
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    if (campaigns.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 px-6 animate-in fade-in zoom-in duration-700">
                <div className="max-w-xl w-full">
                    <div className="relative mb-12">
                        <div className="absolute inset-0 bg-purple-200 blur-[80px] rounded-full opacity-30 transform scale-150 animate-pulse"></div>
                        <div className="relative bg-slate-900 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rotate-12 hover:rotate-0 transition-transform duration-500">
                            <PlusCircle className="w-16 h-16 text-purple-400" />
                        </div>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">{t.emptyTitle}</h3>
                    <p className="text-slate-500 mb-12 leading-relaxed text-xl font-medium max-w-lg mx-auto">
                        {t.emptyDesc}
                    </p>
                    <button
                        type="button"
                        onClick={onCreateNew}
                        className="group inline-flex items-center justify-center gap-4 rounded-2xl bg-slate-900 px-12 py-6 text-xl font-black text-white shadow-2xl shadow-slate-900/20 hover:bg-black hover:scale-[1.05] active:scale-95 transition-all"
                    >
                        {t.btn}
                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight lg:text-5xl">
                        {t.title}
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">{t.subtitle}</p>
                </div>
                <button
                    type="button"
                    onClick={onCreateNew}
                    className="group relative inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                    <PlusCircle size={20} className="text-purple-400 group-hover:rotate-90 transition-transform duration-500" />
                    {t.newBtn}
                </button>
            </div>

            {/* Stats Overview Grid (Mini-Dashboard) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <QuickStat label="Active" value={campaigns.filter(c => c.status === 'ACTIVE').length.toString()} color="bg-green-500" />
                <QuickStat label="Burn Rate" value={`${campaigns.filter(c => c.status === 'ACTIVE').reduce((acc, c) => acc + (c.budget || 0), 0)}`} sub="tokens/zi" color="bg-purple-500" />
                <QuickStat label="Total" value={campaigns.length.toString()} color="bg-blue-500" />
                <QuickStat label="Efficiency" value="94%" color="bg-orange-500" />
            </div>

            {/* Campaigns List (Horizontal - TikTok Style) */}
            <div className="space-y-4">
                {/* Table Header Wrapper (Desktop Only) */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <div className="col-span-4">Campaign Details</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-center">Budget</div>
                    <div className="col-span-2 text-center">Spent</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="space-y-4">
                    {campaigns.map((campaign) => {
                        const isActive = campaign.status === 'ACTIVE';
                        const isPaused = campaign.status === 'PAUSED';
                        const isDraft = campaign.status === 'DRAFT';
                        const isProcessing = campaign.id ? processingIds.has(campaign.id) : false;

                        return (
                            <div
                                key={campaign.id || nanoid()}
                                onClick={() => campaign.id && onView(campaign.id)}
                                className={`group relative bg-white rounded-[2rem] border-2 transition-all duration-300 cursor-pointer
                                    ${isActive
                                        ? 'border-transparent shadow-xl shadow-slate-200/50 hover:shadow-purple-500/10 hover:border-purple-100'
                                        : 'border-slate-50 opacity-90 hover:opacity-100'}`}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 p-6 lg:px-10">
                                    {/* Campaign Info */}
                                    <div className="lg:col-span-4 flex items-center gap-5">
                                        <div className="relative h-16 w-16 rounded-2xl bg-slate-900 overflow-hidden flex-shrink-0 shadow-lg">
                                            {campaign.video_url ? (
                                                <video src={campaign.video_url} className="w-full h-full object-cover opacity-60" muted />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-slate-900 opacity-40" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Smartphone size={18} className="text-white/80" />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-slate-900 font-bold text-lg truncate group-hover:text-purple-600 transition-colors">
                                                {campaign.name || 'Untitled Campaign'}
                                            </h3>
                                            <p className="text-slate-400 text-[10px] font-bold truncate flex items-center gap-1.5 mt-1.5">
                                                <Link size={10} className="text-purple-400" />
                                                <span className="text-slate-300 uppercase tracking-tighter mr-1">{lang === 'ro' ? 'Destinație:' : 'Destination:'}</span>
                                                {campaign.url.replace(/^https?:\/\/(www\.)?/, '')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="lg:col-span-2 flex justify-start lg:justify-center">
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 
                                            ${isActive ? 'bg-green-50 text-green-600 border border-green-100' :
                                                isPaused ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    isDraft ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                        'bg-slate-100 text-slate-500'}`}>
                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' :
                                                isPaused ? 'bg-amber-500' :
                                                    isDraft ? 'bg-blue-500' :
                                                        'bg-slate-400'}`} />
                                            {isActive ? (lang === 'ro' ? 'ACTIVĂ' : 'ACTIVE') :
                                                isPaused ? (lang === 'ro' ? 'ÎN PAUZĂ' : 'PAUSED') :
                                                    isDraft ? (lang === 'ro' ? 'DRAFT' : 'DRAFT') :
                                                        campaign.status}
                                        </div>
                                    </div>

                                    {/* Budget */}
                                    <div className="lg:col-span-2 flex flex-col items-start lg:items-center">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest lg:hidden mb-1">Budget</span>
                                        <div className="flex flex-col items-start lg:items-center">
                                            <span className="text-lg font-black text-slate-900 tabular-nums">{campaign.budget}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">tokens / zi</span>
                                        </div>
                                    </div>

                                    {/* Spent */}
                                    <div className="lg:col-span-2 flex flex-col items-start lg:items-center">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest lg:hidden mb-1">Spent</span>
                                        <div className="flex flex-col items-start lg:items-center">
                                            <span className="text-lg font-black text-slate-900 tabular-nums">{campaign.tokens_spent || 0}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">tokens total</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="lg:col-span-2 flex items-center justify-end gap-2">
                                        {campaign.tiktok_campaign_id && (
                                            <button
                                                type={'button'}
                                                disabled={isProcessing}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    campaign.id && handleAction(campaign.id, onToggle);
                                                }}
                                                className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all shadow-md active:scale-90
                                                    ${isActive ? 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100' :
                                                        'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100'}`}
                                            >
                                                {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                            </button>
                                        )}
                                        <button
                                            type={'button'}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                campaign.id && onView(campaign.id);
                                            }}
                                            className="h-11 px-4 rounded-xl bg-slate-50 text-slate-900 border border-slate-100 hover:bg-white hover:border-purple-200 transition-all active:scale-95"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                        <button
                                            type={'button'}
                                            disabled={isProcessing}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(lang === 'ro' ? 'Ești sigur că vrei să ștergi această campanie?' : 'Are you sure you want to delete this campaign?')) {
                                                    campaign.id && handleAction(campaign.id, onDelete);
                                                }
                                            }}
                                            className="h-11 w-11 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-red-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Processing Overlay */}
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-white/60 z-30 flex items-center justify-center backdrop-blur-sm rounded-[2rem]">
                                        <Loader2 className="animate-spin text-purple-600" size={24} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Create New Row Button */}
                <button
                    type="button"
                    onClick={onCreateNew}
                    className="w-full flex items-center justify-center gap-4 p-8 rounded-[2rem] border-4 border-dashed border-slate-100 bg-white hover:border-purple-200 hover:bg-purple-50/20 transition-all group"
                >
                    <PlusCircle size={28} className="text-slate-300 group-hover:text-purple-600 group-hover:rotate-90 transition-all duration-500" />
                    <span className="text-xl font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest">{t.newBtn}</span>
                </button>
            </div>
        </div>
    );
}

function QuickStat({ label, value, sub, color }: { label: string, value: string, sub?: string, color: string }) {
    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-500">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 bg-slate-50 opacity-40 group-hover:scale-110 transition-transform duration-500`}></div>
            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-2 h-2 rounded-full ${color}`}></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-950 tracking-tight tabular-nums">{value}</span>
                    {sub && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub}</span>}
                </div>
            </div>
        </div>
    );
}