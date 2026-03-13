import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import targetingService, { type Location } from '../../services/targetingService';

interface GeoSelectorProps {
    selectedCountries: string[];
    selectedRegions: string[];
    onChange: (data: { countries: string[], regions: string[] }) => void;
    lang: string;
}

export default function GeoSelector({ selectedCountries, selectedRegions, onChange, lang }: GeoSelectorProps) {
    const [countries, setCountries] = useState<Location[]>([]);
    const [regions, setRegions] = useState<Location[]>([]);

    useEffect(() => {
        targetingService.getCountries(lang).then(setCountries).catch(console.error);
    }, [lang]);

    useEffect(() => {
        if (selectedCountries.length === 1) {
            targetingService.getRegions(selectedCountries[0], lang).then(setRegions).catch(console.error);
        } else {
            setRegions([]);
        }
    }, [selectedCountries, lang]);

    const toggleCountry = (code: string) => {
        const newCountries = selectedCountries.includes(code)
            ? selectedCountries.filter(c => c !== code)
            : [...selectedCountries, code];

        // If unselecting the only country, clear regions too
        const newRegions = newCountries.length === 1 ? selectedRegions : [];
        onChange({ countries: newCountries, regions: newRegions });
    };

    const toggleRegion = (id: string) => {
        const newRegions = selectedRegions.includes(id)
            ? selectedRegions.filter(r => r !== id)
            : [...selectedRegions, id];
        onChange({ countries: selectedCountries, regions: newRegions });
    };

    const t = {
        ro: { title: "Locație", sub: "Unde vrei să fie afișată reclama?", countries: "Țări", regions: "Regiuni (opțional)", select: "Selectează" },
        en: { title: "Location", sub: "Where should your ad appear?", countries: "Countries", regions: "Regions (optional)", select: "Select" }
    }[lang === 'ro' ? 'ro' : 'en'];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-slate-800">
                <Globe size={20} className="text-purple-600" />
                <h3 className="text-lg font-bold">{t.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Countries */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.countries}</label>
                    <div className="flex flex-wrap gap-2">
                        {countries.map(c => (
                            <button
                                key={c.code}
                                onClick={() => c.code && toggleCountry(c.code)}
                                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${selectedCountries.includes(c.code!)
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                                    }`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Regions - only if 1 country selected */}
                {selectedCountries.length === 1 && regions.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.regions}</label>
                        <div className="flex flex-wrap gap-2">
                            {regions.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => r.id && toggleRegion(r.id)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${selectedRegions.includes(r.id!)
                                        ? 'bg-indigo-500 text-white border-indigo-500'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300'
                                        }`}
                                >
                                    {r.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
