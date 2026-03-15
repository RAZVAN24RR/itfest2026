import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, Video, Filter, Activity } from 'lucide-react';
import campaignService, { type CampaignMapMarker } from '../../services/campaignService';
import { useLanguage } from '../../context/LanguageContext';

const EVENT_ICON: Record<string, { emoji: string; bg: string }> = {
    blood_donation: { emoji: '🩸', bg: 'bg-red-500' },
    hackathon: { emoji: '💻', bg: 'bg-blue-500' },
    volunteering: { emoji: '🤝', bg: 'bg-green-500' },
    recycling: { emoji: '♻️', bg: 'bg-emerald-600' },
    community_gathering: { emoji: '🏘️', bg: 'bg-amber-500' },
    charity: { emoji: '💛', bg: 'bg-yellow-500' },
    education: { emoji: '📚', bg: 'bg-indigo-500' },
    health: { emoji: '🏥', bg: 'bg-pink-500' },
    sports: { emoji: '🏃', bg: 'bg-orange-500' },
    culture: { emoji: '🎭', bg: 'bg-purple-500' },
    animal_rescue: { emoji: '🐾', bg: 'bg-teal-500' },
    disaster_relief: { emoji: '🆘', bg: 'bg-rose-600' },
    marathon: { emoji: '🏅', bg: 'bg-sky-500' },
};

function createEmojiIcon(eventType: string | null | undefined, category: string) {
    const ev = (eventType || '').trim();
    const mapped = ev ? EVENT_ICON[ev] : null;
    let emoji = mapped?.emoji ?? '📍';
    let bgColor = mapped?.bg ?? 'bg-slate-500';
    if (!mapped) {
        const c = category.toLowerCase();
        if (c.includes('sânge') || c.includes('donare')) { emoji = '🩸'; bgColor = 'bg-red-500'; }
        else if (c.includes('recicl')) { emoji = '♻️'; bgColor = 'bg-green-500'; }
        else if (c.includes('edu')) { emoji = '📚'; bgColor = 'bg-indigo-500'; }
        else if (c.includes('fond') || c.includes('carit')) { emoji = '💛'; bgColor = 'bg-yellow-500'; }
    }
    return L.divIcon({
        className: 'custom-emoji-icon',
        html: `<div class="${bgColor} w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg border-2 border-white transform transition-transform hover:scale-110">${emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

export default function CommunityMap() {
    const { language } = useLanguage();
    const [markers, setMarkers] = useState<CampaignMapMarker[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedCity, setSelectedCity] = useState<string>('all');

    useEffect(() => {
        const fetchMarkers = async () => {
            try {
                setIsLoading(true);
                const data = await campaignService.getMapMarkers();
                setMarkers(data);
            } catch (error) {
                console.error("Failed to load map markers:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMarkers();
    }, []);

    // Derived unique categories and cities for filters
    const categories = Array.from(new Set(markers.map(m => m.category)));

    const cities = Array.from(new Set(markers.map(m => m.city).filter(Boolean))) as string[];

    const filteredMarkers = markers.filter(m => {
        const matchCategory = selectedCategory === 'all' || m.category === selectedCategory;
        const matchCity = selectedCity === 'all' || m.city === selectedCity;
        return matchCategory && matchCity;
    });

    const totalImpressions = filteredMarkers.reduce((a, m) => a + (m.impressions ?? m.estimated_reach ?? 0), 0);
    const totalClicks = filteredMarkers.reduce((a, m) => a + (m.clicks ?? 0), 0);

    const t = {
        ro: {
            title: "Harta Comunitară",
            sub: "Vizualizează impactul campaniilor generate în timp real.",
            filters: "Filtrează Campaniile",
            allCategories: "Toate Categoriile",
            allCities: "Toate Orașele",
            reach: "Impressions (TikTok Ads)",
            active: "Campanii Active",
            target: "Target:",
            reachLabel: "Reach:",
            video: "Video Generat",
            clicksLabel: "Click-uri",
            tiktok: "Metrici TikTok Ads (sandbox/demo)",
        },
        en: {
            title: "Community Map",
            sub: "Visualize the impact of generated campaigns in real-time.",
            filters: "Filter Campaigns",
            allCategories: "All Categories",
            allCities: "All Cities",
            reach: "Impressions (TikTok Ads)",
            active: "Active Campaigns",
            target: "Target:",
            reachLabel: "Reach:",
            video: "Generated Video",
            clicksLabel: "Clicks",
            tiktok: "TikTok Ads metrics (sandbox/demo)",
        }
    }[language];

    // Centru aproximativ al României
    const centerPosition: [number, number] = [45.9432, 24.9668];
    const defaultZoom = 6;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 animate-pulse">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Activity className="text-blue-500" size={32} />
                </div>
                <p className="text-slate-500 font-medium">Se încarcă harta...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.title}</h2>
                <p className="text-slate-500 mt-2 font-medium">{t.sub}</p>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.active}</p>
                        <p className="text-4xl font-black text-slate-900 mt-1">{filteredMarkers.length}</p>
                    </div>
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Activity size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-10 -mt-10 opacity-50" />
                    <div className="relative">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.reach}</p>
                        <p className="text-4xl font-black text-slate-900 mt-1">{totalImpressions.toLocaleString()}</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">{t.clicksLabel}: {totalClicks.toLocaleString()}</p>
                    </div>
                    <div className="relative w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <Users size={24} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/30 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-400 px-2">
                    <Filter size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">{t.filters}</span>
                </div>

                <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium outline-none"
                >
                    <option value="all">{t.allCategories}</option>
                    {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select
                    value={selectedCity}
                    onChange={e => setSelectedCity(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium outline-none"
                >
                    <option value="all">{t.allCities}</option>
                    {cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Map Container */}
            <div className="bg-white border border-slate-100 p-2 rounded-3xl shadow-xl shadow-slate-200/50">
                <div className="rounded-[1.5rem] overflow-hidden border border-slate-100 h-[600px] z-0">
                    <MapContainer
                        center={centerPosition}
                        zoom={defaultZoom}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%", zIndex: 0 }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />

                        {filteredMarkers.map((marker) => (
                            <Marker
                                key={marker.id}
                                position={[marker.lat, marker.lng]}
                                icon={createEmojiIcon(marker.event_type, marker.category)}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[200px]">
                                        <h3 className="font-black text-base text-slate-900 leading-tight mb-1">{marker.title}</h3>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 mb-1">{marker.category}</p>
                                        <p className="text-[9px] text-slate-400 mb-2">{t.tiktok}</p>

                                        <div className="space-y-1.5 mb-3 text-xs">
                                            <div className="flex justify-between"><span className="text-slate-500">Impressions</span><span className="font-bold">{(marker.impressions ?? marker.estimated_reach).toLocaleString()}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500">Clicks</span><span className="font-bold text-blue-600">{(marker.clicks ?? 0).toLocaleString()}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500">CTR</span><span className="font-bold">{(marker.ctr_pct ?? 0).toFixed(2)}%</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500">Shares</span><span className="font-bold">{(marker.shares ?? 0).toLocaleString()}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500">Spend</span><span className="font-bold">{Number(marker.spend_ron ?? 0).toFixed(2)} RON</span></div>
                                        </div>

                                        {marker.video_url && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <a href={marker.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white rounded-lg py-2 text-xs font-bold hover:bg-slate-800 transition-colors">
                                                    <Video size={14} />
                                                    {t.video}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            <style>{`
                .leaflet-container {
                    font-family: inherit;
                    z-index: 10;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 1rem;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    border: 1px solid #f1f5f9;
                }
                .leaflet-popup-content {
                    margin: 12px;
                }
                .leaflet-popup-tip-container {
                    overflow: visible;
                }
            `}</style>
        </div>
    );
}
