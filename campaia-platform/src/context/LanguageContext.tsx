import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'ro' | 'en';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (roText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'ro' ? 'en' : 'ro'));
    };

    const t = (roText: string, enText: string) => {
        return language === 'ro' ? roText : enText;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}