/**
 * Campaia - Simple Targeting Selector
 * 
 * Simplified targeting component that works 100% with TikTok Marketing API.
 * Only includes options that are guaranteed to work.
 * 
 * TikTok API limitations:
 * - Age: Only fixed groups (18-24, 25-34, 35-44, 45-54, 55+)
 * - Gender: MALE, FEMALE, UNLIMITED
 * - Countries: Requires specific location IDs
 */

import { Globe, Users, UserCheck } from 'lucide-react';

// TikTok Location IDs for supported countries
// Source: TikTok Marketing API
export const TIKTOK_COUNTRIES = [
    { code: 'RO', id: '642', name: 'România', nameEn: 'Romania', flag: '🇷🇴' },
    { code: 'DE', id: '276', name: 'Germania', nameEn: 'Germany', flag: '🇩🇪' },
    { code: 'FR', id: '250', name: 'Franța', nameEn: 'France', flag: '🇫🇷' },
    { code: 'IT', id: '380', name: 'Italia', nameEn: 'Italy', flag: '🇮🇹' },
    { code: 'ES', id: '724', name: 'Spania', nameEn: 'Spain', flag: '🇪🇸' },
    { code: 'GB', id: '826', name: 'Marea Britanie', nameEn: 'United Kingdom', flag: '🇬🇧' },
    { code: 'US', id: '840', name: 'SUA', nameEn: 'United States', flag: '🇺🇸' },
    { code: 'NL', id: '528', name: 'Olanda', nameEn: 'Netherlands', flag: '🇳🇱' },
    { code: 'PL', id: '616', name: 'Polonia', nameEn: 'Poland', flag: '🇵🇱' },
    { code: 'AT', id: '040', name: 'Austria', nameEn: 'Austria', flag: '🇦🇹' },
];

// TikTok Age Groups - these are the ONLY options TikTok supports
export const TIKTOK_AGE_GROUPS = [
    { id: 'AGE_18_24', label: '18-24', labelEn: '18-24 (Gen Z)', emoji: '🎮' },
    { id: 'AGE_25_34', label: '25-34', labelEn: '25-34 (Millennials)', emoji: '💼' },
    { id: 'AGE_35_44', label: '35-44', labelEn: '35-44', emoji: '🏠' },
    { id: 'AGE_45_54', label: '45-54', labelEn: '45-54', emoji: '📱' },
    { id: 'AGE_55_100', label: '55+', labelEn: '55+', emoji: '🌟' },
];

// TikTok Gender options
// Romanian Cities for Community Map
export const ROMANIAN_CITIES = [
    { name: 'București', lat: 44.4268, lng: 26.1025, emoji: '🏛️' },
    { name: 'Cluj-Napoca', lat: 46.7712, lng: 23.5901, emoji: '🎓' },
    { name: 'Timișoara', lat: 45.7489, lng: 21.2087, emoji: '🎭' },
    { name: 'Iași', lat: 47.1585, lng: 27.5681, emoji: '📚' },
    { name: 'Constanța', lat: 44.1598, lng: 28.6348, emoji: '⚓' },
    { name: 'Brașov', lat: 45.6427, lng: 25.5887, emoji: '🏔️' },
    { name: 'Craiova', lat: 44.3302, lng: 23.7949, emoji: '⛲' },
    { name: 'Galați', lat: 45.4353, lng: 28.008, emoji: '🏗️' },
    { name: 'Oradea', lat: 47.0465, lng: 21.9189, emoji: '🏰' },
    { name: 'Sibiu', lat: 45.7935, lng: 24.1521, emoji: '👀' },
];

export interface SimpleTargetingData {
    countries: string[];
    ageGroups: string[];
    gender: string;
    city?: string;
    lat?: number;
    lng?: number;
}

interface SimpleTargetingSelectorProps {
    value: SimpleTargetingData;
    onChange: (data: SimpleTargetingData) => void;
    lang: 'ro' | 'en';
    disabled?: boolean;
}

export default function SimpleTargetingSelector({
    value,
    onChange,
    lang,
    disabled = false
}: SimpleTargetingSelectorProps) {
    const texts = {
        ro: {
            countries: 'Țări',
            countriesHint: 'Selectează unde vrei să fie văzut videoclipul',
            age: 'Grupe de Vârstă',
            ageHint: 'Alege categoriile de vârstă țintă',
            gender: 'Gen',
            genderHint: 'Cui vrei să i se afișeze',
            allAges: 'Toate grupele',
            note: '⚡ Aceste setări NU pot fi modificate după publicare',
            city: 'Oraș (Harta Comunitară)',
            cityHint: 'Alege orașul principal pentru a apărea pe harta comunității',
            selectCity: 'Selectează orașul'
        },
        en: {
            countries: 'Countries',
            countriesHint: 'Select where you want your video to be seen',
            age: 'Age Groups',
            ageHint: 'Choose target age categories',
            gender: 'Gender',
            genderHint: 'Who should see your ad',
            allAges: 'All age groups',
            note: '⚡ These settings CANNOT be changed after publishing',
            city: 'City (Community Map)',
            cityHint: 'Choose the main city to appear on the community map',
            selectCity: 'Select city'
        }
    };

    const t = lang === 'ro' ? texts.ro : texts.en;

    const toggleCountry = (code: string) => {
        if (disabled) return;
        const newCountries = value.countries.includes(code)
            ? value.countries.filter(c => c !== code)
            : [...value.countries, code];
        onChange({ ...value, countries: newCountries.length > 0 ? newCountries : ['RO'] });
    };

    const toggleAgeGroup = (id: string) => {
        if (disabled) return;
        const newAgeGroups = value.ageGroups.includes(id)
            ? value.ageGroups.filter(a => a !== id)
            : [...value.ageGroups, id];
        onChange({ ...value, ageGroups: newAgeGroups.length > 0 ? newAgeGroups : TIKTOK_AGE_GROUPS.map(a => a.id) });
    };

    const selectAllAges = () => {
        if (disabled) return;
        onChange({ ...value, ageGroups: TIKTOK_AGE_GROUPS.map(a => a.id) });
    };

    const setGender = (gender: string) => {
        if (disabled) return;
        onChange({ ...value, gender });
    };

    const setCity = (cityName: string) => {
        if (disabled) return;
        const cityObj = ROMANIAN_CITIES.find(c => c.name === cityName);
        if (cityObj) {
            onChange({
                ...value,
                city: cityObj.name,
                lat: cityObj.lat,
                lng: cityObj.lng
            });
        }
    };

    const allAgesSelected = value.ageGroups.length === TIKTOK_AGE_GROUPS.length;

    return (
        <div className="space-y-6">
            {/* Warning Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-amber-800 text-sm font-medium">
                <span>{t.note}</span>
            </div>

            {/* Countries */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <label className="text-sm font-bold text-slate-700">{t.countries}</label>
                </div>
                <p className="text-xs text-slate-400">{t.countriesHint}</p>
                <div className="flex flex-wrap gap-2">
                    {TIKTOK_COUNTRIES.map(country => (
                        <button
                            key={country.code}
                            type="button"
                            onClick={() => toggleCountry(country.code)}
                            disabled={disabled}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${value.countries.includes(country.code)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-slate-100 hover:border-slate-300 text-slate-600'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span>{country.flag}</span>
                            <span>{lang === 'ro' ? country.name : country.nameEn}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Age Groups */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <label className="text-sm font-bold text-slate-700">{t.age}</label>
                    </div>
                    <button
                        type="button"
                        onClick={selectAllAges}
                        disabled={disabled}
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${allAgesSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {t.allAges}
                    </button>
                </div>
                <p className="text-xs text-slate-400">{t.ageHint}</p>
                <div className="flex flex-wrap gap-2">
                    {TIKTOK_AGE_GROUPS.map(age => (
                        <button
                            key={age.id}
                            type="button"
                            onClick={() => toggleAgeGroup(age.id)}
                            disabled={disabled}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${value.ageGroups.includes(age.id)
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-100 hover:border-slate-300 text-slate-500'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span>{age.emoji}</span>
                            <span>{lang === 'ro' ? age.label : age.labelEn}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Gender */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <label className="text-sm font-bold text-slate-700">{t.gender}</label>
                </div>
                <p className="text-xs text-slate-400">{t.genderHint}</p>
                <div className="flex gap-3">
                    {TIKTOK_GENDERS.map(g => (
                        <button
                            key={g.id}
                            type="button"
                            onClick={() => setGender(g.id)}
                            disabled={disabled}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${value.gender === g.id
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-slate-100 hover:border-slate-300 text-slate-500'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span>{g.icon}</span>
                            <span>{lang === 'ro' ? g.label : g.labelEn}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* City Selection for Map */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-orange-500" />
                    <label className="text-sm font-bold text-slate-700">{t.city}</label>
                </div>
                <p className="text-xs text-slate-400">{t.cityHint}</p>
                <div className="flex flex-wrap gap-2">
                    {ROMANIAN_CITIES.map(city => (
                        <button
                            key={city.name}
                            type="button"
                            onClick={() => setCity(city.name)}
                            disabled={disabled}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${value.city === city.name
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-slate-100 hover:border-slate-300 text-slate-600'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span>{city.emoji}</span>
                            <span>{city.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Re-export TIKTOK_GENDERS since it's used elsewhere but was removed in replace
export const TIKTOK_GENDERS = [
    { id: 'GENDER_UNLIMITED', label: 'Toți', labelEn: 'Everyone', icon: '👥' },
    { id: 'GENDER_MALE', label: 'Bărbați', labelEn: 'Men', icon: '👨' },
    { id: 'GENDER_FEMALE', label: 'Femei', labelEn: 'Women', icon: '👩' },
];

// Helper to convert SimpleTargetingData to TikTok API format
export function toTikTokTargeting(data: SimpleTargetingData): {
    location_ids: string[];
    age_groups: string[];
    gender: string;
} {
    return {
        location_ids: data.countries.map(code =>
            TIKTOK_COUNTRIES.find(c => c.code === code)?.id || '642'
        ),
        age_groups: data.ageGroups,
        gender: data.gender
    };
}

// Helper to pretty-print targeting for display
export function formatTargetingDisplay(data: SimpleTargetingData, lang: 'ro' | 'en'): {
    countries: string;
    ages: string;
    gender: string;
} {
    const countriesDisplay = data.countries
        .map(code => TIKTOK_COUNTRIES.find(c => c.code === code)?.flag || code)
        .join(' ');

    const agesDisplay = data.ageGroups.length === TIKTOK_AGE_GROUPS.length
        ? (lang === 'ro' ? 'Toate vârstele' : 'All ages')
        : data.ageGroups.map(id => TIKTOK_AGE_GROUPS.find(a => a.id === id)?.label || id).join(', ');

    const genderDisplay = TIKTOK_GENDERS.find(g => g.id === data.gender)?.[lang === 'ro' ? 'label' : 'labelEn'] || 'All';

    return {
        countries: countriesDisplay,
        ages: agesDisplay,
        gender: genderDisplay
    };
}
