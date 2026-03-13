import { useState, useEffect } from 'react';
import { Users, Target, Smartphone } from 'lucide-react';
import targetingService from '../../services/targetingService';

interface DemographicSelectorProps {
    ageMin: number;
    ageMax: number;
    genders: string[];
    interests: string[];
    devices: string[];
    onChange: (data: any) => void;
    lang: string;
}

export default function DemographicSelector({
    ageMin, ageMax, genders, interests, devices, onChange, lang
}: DemographicSelectorProps) {
    const [availableInterests, setAvailableInterests] = useState<string[]>([]);

    useEffect(() => {
        targetingService.getInterests(lang).then(setAvailableInterests).catch(console.error);
    }, [lang]);

    const t = {
        ro: {
            age: "Vârstă",
            gender: "Gen",
            interests: "Interese",
            devices: "Dispozitive",
            all: "Toți",
            male: "Bărbați",
            female: "Femei",
            ios: "iPhone (iOS)",
            android: "Android"
        },
        en: {
            age: "Age",
            gender: "Gender",
            interests: "Interests",
            devices: "Devices",
            all: "All",
            male: "Male",
            female: "Female",
            ios: "iPhone (iOS)",
            android: "Android"
        }
    }[lang === 'ro' ? 'ro' : 'en'];

    const toggleItem = (list: string[], item: string, field: string) => {
        const newList = list.includes(item)
            ? list.filter(i => i !== item)
            : [...list, item];
        onChange({ [field]: newList });
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Age & Gender */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-800">
                            <Users size={20} className="text-purple-600" />
                            <h3 className="text-lg font-bold">{t.age}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-700 w-12">{ageMin}</span>
                            <input
                                type="range" min="18" max="65" value={ageMin}
                                onChange={(e) => onChange({ age_min: Number(e.target.value) })}
                                className="flex-1 accent-purple-600"
                            />
                            <input
                                type="range" min="18" max="65" value={ageMax}
                                onChange={(e) => onChange({ age_max: Number(e.target.value) })}
                                className="flex-1 accent-purple-600"
                            />
                            <span className="font-bold text-slate-700 w-12">{ageMax}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.gender}</label>
                        <div className="flex gap-2">
                            {['ALL', 'MALE', 'FEMALE'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => onChange({ genders: [g] })}
                                    className={`flex-1 py-2.5 rounded-xl border font-bold transition-all ${genders.includes(g)
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-white text-slate-600 border-slate-200'
                                        }`}
                                >
                                    {g === 'ALL' ? t.all : g === 'MALE' ? t.male : t.female}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Interests & Devices */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-800">
                            <Target size={20} className="text-purple-600" />
                            <h3 className="text-lg font-bold">{t.interests}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1">
                            {availableInterests.map(interest => (
                                <button
                                    key={interest}
                                    onClick={() => toggleItem(interests, interest, 'interests')}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${interests.includes(interest)
                                        ? 'bg-indigo-500 text-white border-indigo-500'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300'
                                        }`}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-800">
                            <Smartphone size={18} className="text-purple-600" />
                            <h3 className="text-lg font-bold">{t.devices}</h3>
                        </div>
                        <div className="flex gap-2">
                            {['IOS', 'ANDROID'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => toggleItem(devices, d, 'devices')}
                                    className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${devices.includes(d)
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-white text-slate-600 border-slate-200'
                                        }`}
                                >
                                    {d === 'IOS' ? t.ios : t.android}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
