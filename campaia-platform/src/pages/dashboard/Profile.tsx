import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, AlertCircle, User, Building2, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useUser } from '../../context/UserContext';
import ProfileTypeSelector from '../../components/ProfileTypeSelector';

interface ProfileData {
    full_name: string;
    phone: string;
    user_type: 'INDIVIDUAL' | 'BUSINESS';
    company_name: string;
    cui: string;
    reg_com: string;
    address: string;
    city: string;
    county: string;
    country: string;
}

export default function Profile() {
    const { language } = useLanguage();
    const { user, token, refreshUser } = useUser();

    const [formData, setFormData] = useState<ProfileData>({
        full_name: '',
        phone: '',
        user_type: 'INDIVIDUAL',
        company_name: '',
        cui: '',
        reg_com: '',
        address: '',
        city: '',
        county: '',
        country: 'Romania'
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [completion, setCompletion] = useState({ percentage: 0, missing: [] as string[] });

    const texts = {
        ro: {
            title: 'Profil',
            subtitle: 'Gestionează informațiile contului tău',
            accountType: 'Tip Cont',
            personalInfo: 'Informații Personale',
            businessInfo: 'Date Firmă',
            fullName: 'Nume Complet',
            phone: 'Telefon',
            companyName: 'Denumire Firmă',
            cui: 'CUI / CIF',
            regCom: 'Reg. Com.',
            address: 'Adresă',
            city: 'Oraș',
            county: 'Județ',
            country: 'Țară',
            save: 'Salvează',
            saving: 'Se salvează...',
            saved: 'Profil salvat cu succes!',
            error: 'Eroare la salvare',
            profileComplete: 'Profilul tău este complet',
            profileIncomplete: 'completat',
            required: 'Obligatoriu'
        },
        en: {
            title: 'Profile',
            subtitle: 'Manage your account information',
            accountType: 'Account Type',
            personalInfo: 'Personal Information',
            businessInfo: 'Business Information',
            fullName: 'Full Name',
            phone: 'Phone',
            companyName: 'Company Name',
            cui: 'VAT / Tax ID',
            regCom: 'Reg. No.',
            address: 'Address',
            city: 'City',
            county: 'County/State',
            country: 'Country',
            save: 'Save',
            saving: 'Saving...',
            saved: 'Profile saved successfully!',
            error: 'Error saving profile',
            profileComplete: 'Your profile is complete',
            profileIncomplete: 'complete',
            required: 'Required'
        }
    };

    const t = language === 'ro' ? texts.ro : texts.en;

    // Load profile on mount
    useEffect(() => {
        loadProfile();
    }, [token]);

    const loadProfile = async () => {
        if (!token) return;

        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/v1/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    user_type: data.user_type || 'INDIVIDUAL',
                    company_name: data.company_name || '',
                    cui: data.cui || '',
                    reg_com: data.reg_com || '',
                    address: data.address || '',
                    city: data.city || '',
                    county: data.county || '',
                    country: data.country || 'Romania'
                });
            }

            // Get completion status
            const completionRes = await fetch(`${API_URL}/api/v1/users/me/completion`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (completionRes.ok) {
                const completionData = await completionRes.json();
                setCompletion({
                    percentage: completionData.percentage,
                    missing: completionData.missing_fields
                });
            }
        } catch (err) {
            console.error('Failed to load profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/v1/users/me`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: t.saved });
                await refreshUser?.();
                await loadProfile();
            } else {
                const errorData = await response.json();
                setMessage({ type: 'error', text: errorData.detail || t.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: t.error });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof ProfileData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight lg:text-5xl">{t.title}</h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">{t.subtitle}</p>
                </div>

                {/* Completion Badge */}
                <div className={`group flex items-center gap-3 px-6 py-3 rounded-2xl shadow-xl transition-all duration-500 ${completion.percentage === 100
                    ? 'bg-green-600 text-white shadow-green-500/20'
                    : 'bg-white border border-amber-200 text-amber-600 shadow-amber-500/5'
                    }`}>
                    <div className={`p-1.5 rounded-lg ${completion.percentage === 100 ? 'bg-white/20' : 'bg-amber-50'}`}>
                        {completion.percentage === 100
                            ? <CheckCircle2 size={18} />
                            : <AlertCircle size={18} className="animate-pulse" />
                        }
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-80">
                            {completion.percentage === 100 ? 'Verified' : 'Incomplete'}
                        </span>
                        <span className="text-sm font-black tracking-tight">
                            {completion.percentage === 100
                                ? t.profileComplete
                                : `${completion.percentage}% ${t.profileIncomplete}`
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-6 rounded-[2rem] flex items-center gap-4 animate-in zoom-in duration-300 shadow-xl ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-100 shadow-green-500/5'
                    : 'bg-red-50 text-red-700 border border-red-100 shadow-red-500/5'
                    }`}>
                    <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <span className="font-bold text-lg">{message.text}</span>
                </div>
            )}

            {/* Account Type Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8 p-2 bg-slate-50 self-start rounded-xl border border-slate-100 max-w-fit">
                        <User size={20} className="text-purple-600" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">{t.accountType}</h2>
                    </div>

                    <ProfileTypeSelector
                        value={formData.user_type}
                        onChange={(type) => handleChange('user_type', type)}
                    />
                </div>
            </div>

            {/* Personal Info Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8 p-2 bg-slate-50 self-start rounded-xl border border-slate-100 max-w-fit">
                        <Phone size={20} className="text-purple-600" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">{t.personalInfo}</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                {t.fullName} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => handleChange('full_name', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-4 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                placeholder={user?.name || ''}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                {t.phone} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-4 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                placeholder="+40 7XX XXX XXX"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Info Section - Only show for BUSINESS type */}
            {formData.user_type === 'BUSINESS' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 group overflow-hidden relative animate-in fade-in slide-in-from-top-6 duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8 p-2 bg-slate-50 self-start rounded-xl border border-slate-100 max-w-fit">
                            <Building2 size={20} className="text-purple-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">{t.businessInfo}</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                    {t.companyName} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.company_name}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-4 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                    placeholder="SC Exemplu SRL"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                    {t.cui} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.cui}
                                    onChange={(e) => handleChange('cui', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-4 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                    placeholder="RO12345678"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                    {t.regCom}
                                </label>
                                <input
                                    type="text"
                                    value={formData.reg_com}
                                    onChange={(e) => handleChange('reg_com', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-4 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                    placeholder="J40/1234/2020"
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                    {t.address} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-4 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                    placeholder="Strada Exemplu, Nr. 123"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                    {t.city} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-4 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                    placeholder="București"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                    {t.county} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.county}
                                    onChange={(e) => handleChange('county', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-4 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                    placeholder="Sector 1"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                    {t.country}
                                </label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => handleChange('country', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-4 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                    placeholder="Romania"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative flex items-center gap-3 px-12 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin text-purple-400" />
                            {t.saving}
                        </>
                    ) : (
                        <>
                            <Save size={18} className="text-purple-400 group-hover:rotate-12 transition-transform" />
                            {t.save}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
