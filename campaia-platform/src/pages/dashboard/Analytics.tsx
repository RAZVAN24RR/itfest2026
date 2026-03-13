import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, Users, Eye, MousePointerClick, ArrowUpRight, ArrowDownRight, Activity, Calendar, Share2, Video, DollarSign
} from 'lucide-react';

const generateMockData = () => {
    const data = [];
    const date = new Date();
    date.setDate(date.getDate() - 30);

    let views = 1500;
    let clicks = 120;
    let conversions = 15;

    for (let i = 0; i < 30; i++) {
        data.push({
            date: date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }),
            views: Math.floor(views + (Math.random() * 500 - 200)),
            clicks: Math.floor(clicks + (Math.random() * 50 - 20)),
            conversions: Math.floor(conversions + (Math.random() * 10 - 4)),
            spend: Math.floor(50 + (Math.random() * 20)),
        });

        // Add trend
        views *= 1.02;
        clicks *= 1.03;
        conversions *= 1.05;
        date.setDate(date.getDate() + 1);
    }
    return data;
};

const campaignPerformanceData = [
    { name: 'Reduceri Primăvară', reach: 45000, engagement: 12000, roas: 3.5 },
    { name: 'Lansare Produs X', reach: 85000, engagement: 34000, roas: 4.8 },
    { name: 'Promo Weekend', reach: 25000, engagement: 5000, roas: 2.1 },
    { name: 'Retargeting vizitatori', reach: 15000, engagement: 8000, roas: 5.2 },
    { name: 'Brand Awareness', reach: 120000, engagement: 15000, roas: 1.8 },
];

export default function Analytics() {
    const [data, setData] = useState<any[]>([]);
    const [timeframe, setTimeframe] = useState('30d');

    useEffect(() => {
        setData(generateMockData());
    }, [timeframe]);

    const stats = [
        {
            title: 'Vizualizări Totale',
            value: '2.4M',
            change: '+15.2%',
            isPositive: true,
            icon: Eye,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            title: 'Click-uri (CTR)',
            value: '45.2K',
            subValue: '1.8% CTR',
            change: '+5.4%',
            isPositive: true,
            icon: MousePointerClick,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        },
        {
            title: 'Cost per Acțiune (CPA)',
            value: '12.5 RON',
            change: '-2.1%',
            isPositive: true, // Lower CPA is better
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            title: 'Distribuiri',
            value: '8,432',
            change: '-1.4%',
            isPositive: false,
            icon: Share2,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
        }
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
                    <p className="font-bold text-slate-800 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm font-medium mt-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-600">{entry.name}:</span>
                            <span className="font-bold whitespace-nowrap" style={{ color: entry.color }}>
                                {entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32 opacity-50 blur-2xl"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-500/30">
                            <TrendingUp size={32} />
                        </div>
                        Performanță Campanii
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Analizează impactul și optimizează bugetul de marketing.</p>
                </div>

                <div className="relative z-10 flex bg-slate-100 p-1.5 rounded-2xl">
                    {['7d', '30d', '90d'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${timeframe === t
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${stat.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">{stat.title}</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                            {stat.subValue && <p className="text-sm font-bold text-slate-400">{stat.subValue}</p>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic Trend */}
                <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Evoluție Trafic</h3>
                            <p className="text-sm font-medium text-slate-500">Vizualizări și click-uri în timp</p>
                        </div>
                        <Activity className="text-purple-500 opacity-50" size={24} />
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                    minTickGap={30}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(val) => `${val / 1000}k`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    name="Vizualizări"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorViews)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="clicks"
                                    name="Click-uri"
                                    stroke="#ec4899"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorClicks)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Conversion Funnel / Spend */}
                <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40">
                    <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-900">Conversii vs Buget</h3>
                        <p className="text-sm font-medium text-slate-500">Raport cost/eficiență</p>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" hide />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="conversions"
                                    name="Conversii"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="spend"
                                    name="Buget (RON)"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Campaign Comparison */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Top Campanii Active</h3>
                        <p className="text-sm font-medium text-slate-500">Comparație ROAS și Reach</p>
                    </div>
                    <button className="px-5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl transition-colors text-sm">
                        Vezi Raport Detaliat
                    </button>
                </div>

                <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={campaignPerformanceData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            barSize={32}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                                width={160}
                            />
                            <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="reach" name="Reach total" fill="#6366f1" radius={[0, 8, 8, 0]} />
                            <Bar dataKey="engagement" name="Engagement" fill="#a855f7" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}