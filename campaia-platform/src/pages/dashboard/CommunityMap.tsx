import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, Video, Target, Filter, Activity } from 'lucide-react';
import campaignService, { type CampaignMapMarker } from '../../services/campaignService';
import { useLanguage } from '../../context/LanguageContext';

// Create custom div icons based on category
const createEmojiIcon = (category: string) => {
    let emoji = '📍';
    let bgColor = 'bg-blue-500';

    if (category.toLowerCase().includes('blood') || category.toLowerCase().includes('donare') || category.toLowerCase().includes('sânge')) {
        emoji = '🩸';
        bgColor = 'bg-red-500';
    } else if (category.toLowerCase().includes('recycle') || category.toLowerCase().includes('reciclare')) {
        emoji = '♻️';
        bgColor = 'bg-green-500';
    } else if (category.toLowerCase().includes('edu') || category.toLowerCase().includes('școală')) {
        emoji = '📚';
        bgColor = 'bg-yellow-500';
    } else if (category.toLowerCase().includes('charity') || category.toLowerCase().includes('caritate')) {
        emoji = '🤝';
        bgColor = 'bg-purple-500';
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

    const totalEstimatedReach = filteredMarkers.reduce((acc, curr) => acc + curr.estimated_reach, 0);

    const t = {
        ro: {
            title: "Harta Comunitară",
            sub: "Vizualizează impactul campaniilor generate în timp real.",
            filters: "Filtrează Campaniile",
            allCategories: "Toate Categoriile",
            allCities: "Toate Orașele",
            reach: "Reach Estimat Total",
            active: "Campanii Active",
            target: "Target:",
            reachLabel: "Reach:",
            video: "Video Generat"
        },
        en: {
            title: "Community Map",
            sub: "Visualize the impact of generated campaigns in real-time.",
            filters: "Filter Campaigns",
            allCategories: "All Categories",
            allCities: "All Cities",
            reach: "Total Estimated Reach",
            active: "Active Campaigns",
            target: "Target:",
            reachLabel: "Reach:",
            video: "Generated Video"
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
                        <p className="text-4xl font-black text-slate-900 mt-1">{totalEstimatedReach.toLocaleString()}</p>
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
                                icon={createEmojiIcon(marker.category)}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[200px]">
                                        <h3 className="font-black text-base text-slate-900 leading-tight mb-1">{marker.title}</h3>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 mb-3">{marker.category}</p>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Target size={14} className="text-slate-400" />
                                                <span className="text-slate-600 font-medium">18-35 (Estimat)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users size={14} className="text-slate-400" />
                                                <span className="text-green-600 font-bold">{marker.estimated_reach.toLocaleString()} {t.reachLabel.replace(':', '')}</span>
                                            </div>
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
