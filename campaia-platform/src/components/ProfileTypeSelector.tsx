import { Building2, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ProfileTypeSelectorProps {
    value: 'INDIVIDUAL' | 'BUSINESS';
    onChange: (type: 'INDIVIDUAL' | 'BUSINESS') => void;
    disabled?: boolean;
}

export default function ProfileTypeSelector({ value, onChange, disabled }: ProfileTypeSelectorProps) {
    const { language } = useLanguage();

    const texts = {
        ro: {
            individual: 'Persoană Fizică',
            individualDesc: 'Pentru freelanceri și persoane fizice',
            business: 'Companie',
            businessDesc: 'Pentru firme cu CUI și facturare'
        },
        en: {
            individual: 'Individual',
            individualDesc: 'For freelancers and individuals',
            business: 'Business',
            businessDesc: 'For companies with VAT and billing'
        }
    };

    const t = language === 'ro' ? texts.ro : texts.en;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Individual Option */}
            <button
                type="button"
                onClick={() => !disabled && onChange('INDIVIDUAL')}
                disabled={disabled}
                className={`
                    relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300
                    ${value === 'INDIVIDUAL'
                        ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                    }
                    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                {/* Selection indicator */}
                <div className={`
                    absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all
                    ${value === 'INDIVIDUAL'
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-slate-300 bg-white'
                    }
                `}>
                    {value === 'INDIVIDUAL' && (
                        <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>

                {/* Icon */}
                <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors
                    ${value === 'INDIVIDUAL' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'}
                `}>
                    <User size={32} />
                </div>

                {/* Text */}
                <h3 className={`text-lg font-bold mb-1 ${value === 'INDIVIDUAL' ? 'text-purple-700' : 'text-slate-700'}`}>
                    {t.individual}
                </h3>
                <p className="text-sm text-slate-500 text-center">
                    {t.individualDesc}
                </p>
            </button>

            {/* Business Option */}
            <button
                type="button"
                onClick={() => !disabled && onChange('BUSINESS')}
                disabled={disabled}
                className={`
                    relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300
                    ${value === 'BUSINESS'
                        ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                    }
                    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                {/* Selection indicator */}
                <div className={`
                    absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all
                    ${value === 'BUSINESS'
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-slate-300 bg-white'
                    }
                `}>
                    {value === 'BUSINESS' && (
                        <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>

                {/* Icon */}
                <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors
                    ${value === 'BUSINESS' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'}
                `}>
                    <Building2 size={32} />
                </div>

                {/* Text */}
                <h3 className={`text-lg font-bold mb-1 ${value === 'BUSINESS' ? 'text-purple-700' : 'text-slate-700'}`}>
                    {t.business}
                </h3>
                <p className="text-sm text-slate-500 text-center">
                    {t.businessDesc}
                </p>
            </button>
        </div>
    );
}
