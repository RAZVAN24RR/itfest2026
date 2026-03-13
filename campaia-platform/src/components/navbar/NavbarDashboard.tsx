import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Menu, CreditCard, Settings } from 'lucide-react';
import NavbarLogo from './NavbarLogo';
import NavbarLanguage from './NavbarLanguage';
import { useUser } from "../../context/UserContext.tsx";

interface NavbarDashboardProps {
    onNavigate?: (page: 'billing' | 'settings') => void;
}

export default function NavbarDashboard({ onNavigate }: NavbarDashboardProps) {
    const { user, logout } = useUser();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [isBurgerOpen, setIsBurgerOpen] = useState(false);
    const burgerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (burgerRef.current && !burgerRef.current.contains(event.target as Node)) {
                setIsBurgerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleNavigation = (page: 'billing' | 'settings') => {
        if (onNavigate) {
            onNavigate(page);
        }
        setIsBurgerOpen(false);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100 relative z-50 pt-8 pb-4 lg:py-0 transition-all">            <div className="flex h-16 items-center justify-between">

                <div className="flex items-center gap-3 md:gap-4">

                    <div className="lg:hidden relative" ref={burgerRef}>
                        <button
                            type={'button'}
                            onClick={() => setIsBurgerOpen(!isBurgerOpen)}
                            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-purple-600 transition-colors focus:outline-none"
                        >
                            <Menu size={24} />
                        </button>

                        {isBurgerOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Meniu Rapid
                                </div>
                                <button
                                    type={'button'}
                                    onClick={() => handleNavigation('billing')}
                                    className="w-full flex items-center gap-3 text-sm text-slate-600 hover:text-purple-600 hover:bg-purple-50 p-2.5 rounded-lg transition-colors text-left"
                                >
                                    <CreditCard size={16} />
                                    <span className="font-medium">Billing</span>
                                </button>
                                <button
                                    type={'button'}
                                    onClick={() => handleNavigation('settings')}
                                    className="w-full flex items-center gap-3 text-sm text-slate-600 hover:text-purple-600 hover:bg-purple-50 p-2.5 rounded-lg transition-colors text-left"
                                >
                                    <Settings size={16} />
                                    <span className="font-medium">Settings</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <NavbarLogo />
                </div>

                <div className="flex items-center gap-2 md:gap-4">

                    <NavbarLanguage />

                    <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-100">
                        {user ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    type={'button'}
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-3 cursor-pointer focus:outline-none"
                                >
                                    <span className="hidden lg:block text-sm font-medium text-slate-600">
                                        {user.name}
                                    </span>
                                    <img
                                        src={user.picture}
                                        alt={user.name}
                                        className={`h-9 w-9 rounded-full border shadow-sm object-cover transition-all ${isProfileOpen ? 'ring-2 ring-purple-100 border-purple-200' : 'border-slate-200'}`}
                                        referrerPolicy="no-referrer"
                                    />
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                            <p className="text-xs text-slate-400">Signed in as</p>
                                            <p className="text-xs font-bold text-slate-700 truncate" title={user.email}>
                                                {user.email}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                logout();
                                                setIsProfileOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-left"
                                        >
                                            <LogOut size={14} />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 text-purple-600 shadow-sm cursor-pointer hover:bg-purple-100 transition-colors">
                                <User size={18} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}