import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function NavbarLanguage() {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-all active:scale-95 shadow-sm"
        >
            <Globe size={14} />
            <span>{language === 'ro' ? 'RO' : 'EN'}</span>
        </button>
    );
}