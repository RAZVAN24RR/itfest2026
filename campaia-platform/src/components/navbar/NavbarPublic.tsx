import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import NavbarLogo from './NavbarLogo';
import NavbarLanguage from './NavbarLanguage';

export default function NavbarPublic() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t } = useLanguage();

    return (
        <div className="mx-auto max-w-7xl px-4 pt-8 lg:pt-0 transition-all">
            <div className="flex h-16 items-center justify-between">
                <NavbarLogo />

                <div className="hidden md:flex items-center gap-3">
                    <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
                    <NavbarLanguage />

                    <Link
                        to="/signin"
                        className="text-sm font-bold !text-slate-600 hover:!text-purple-600 transition-colors px-3 py-2"
                    >
                        {t('Autentificare', 'Sign in')}
                    </Link>
                    <Link
                        to="/signin"
                        className="flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-bold !text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        {t('Începe Acum', 'Get Started')}
                    </Link>
                </div>

                <div className="flex items-center gap-3 md:hidden">
                    <NavbarLanguage />

                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="bg-white border border-slate-200 shadow-sm p-2 rounded-lg text-slate-500 hover:text-purple-600 transition-all active:scale-95"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl absolute w-full left-0 shadow-xl animate-in slide-in-from-top-5 duration-200 z-50">
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col gap-3 pt-2">
                            <Link
                                to="/signin"
                                className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <LogIn size={16} className="text-slate-400" />
                                {t('Autentificare', 'Sign in')}
                            </Link>
                            <Link
                                to="/signin"
                                className="flex items-center justify-center w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-center text-sm font-bold !text-white shadow-lg shadow-purple-500/25 active:scale-95 transition-all mt-1"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {t('Începe Acum', 'Get Started')}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}