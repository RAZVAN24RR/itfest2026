import type { CampaignData } from "../../interfaces/campaign.ts";
import { nanoid } from "nanoid";
import { Smartphone, History as HistoryIcon, CheckCircle2 } from 'lucide-react';

interface HistoryProps {
    campaigns: CampaignData[];
    lang: string;
}

export default function History({ campaigns, lang }: HistoryProps) {
    const title = lang === 'ro' ? "Istoric Lansări" : "Launch History";
    const sub = lang === 'ro' ? "Arhiva completă a succeselor tale pe TikTok." : "Your complete archive of TikTok successes.";

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight lg:text-5xl">{title}</h1>
                <p className="text-slate-500 mt-2 text-lg font-medium">{sub}</p>
            </div>

            {campaigns.length === 0 ? (
                <div className="p-20 text-center border-4 border-dashed border-slate-100 rounded-[2.5rem] bg-white flex flex-col items-center justify-center">
                    <div className="bg-slate-50 p-6 rounded-3xl mb-6 text-slate-200">
                        <HistoryIcon size={48} />
                    </div>
                    <p className="text-xl font-black text-slate-400">
                        {lang === 'ro' ? "Nicio campanie în arhivă încă." : "History is empty for now."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {campaigns.map((c) => (
                        <div key={nanoid()} className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300">
                            <div className="flex items-center gap-6">
                                <div className="bg-slate-900 p-4 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                                    <Smartphone size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{c.url.replace(/^https?:\/\/(www\.)?/, '')}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{c.date || 'Recent Launch'}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TikTok Ads</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Budget</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <span className="text-xl font-black text-slate-900 tabular-nums">{c.budget} <span className="text-[10px] text-slate-400">tk</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        <span className="text-xl font-black text-slate-900">{c.duration} <span className="text-[10px] text-slate-400">{lang === 'ro' ? 'Zile' : 'Days'}</span></span>
                                    </div>
                                </div>
                                <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors duration-300">
                                    <CheckCircle2 size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}