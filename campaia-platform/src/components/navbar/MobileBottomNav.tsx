import { LayoutDashboard, PlusCircle, Receipt, User, Camera } from 'lucide-react';

interface MobileBottomNavProps {
    activePage: 'overview' | 'new' | 'settings' | 'analytics' | 'billing' | 'profile' | 'buyTokens' | 'videos' | 'details' | 'integrations' | 'communityMap';
    setActivePage: (page: 'overview' | 'new' | 'settings' | 'analytics' | 'billing' | 'profile' | 'buyTokens' | 'videos' | 'details' | 'integrations' | 'communityMap') => void;
}

export default function MobileBottomNav({ activePage, setActivePage }: MobileBottomNavProps) {

    const getButtonStyle = (pageName: string) =>
        `flex flex-col items-center justify-center gap-1 p-1.5 min-w-[48px] transition-all duration-300 active:scale-90 ${activePage === pageName
            ? 'text-purple-600'
            : 'text-slate-400'
        }`;

    return (
        <div className="lg:hidden fixed bottom-4 left-3 right-3 z-[100]">
            <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-[1.5rem] px-2 py-2">
                <div className="flex items-center justify-between max-w-md mx-auto relative">

                    {/* Overview */}
                    <button type={'button'} onClick={() => setActivePage('overview')} className={getButtonStyle('overview')}>
                        <div className={`p-2 rounded-xl transition-all duration-300 ${activePage === 'overview' ? 'bg-purple-100' : ''}`}>
                            <LayoutDashboard size={18} strokeWidth={activePage === 'overview' ? 2.5 : 2} />
                        </div>
                    </button>

                    {/* Videos/Camera - Important for testing */}
                    <button type={'button'} onClick={() => setActivePage('videos')} className={getButtonStyle('videos')}>
                        <div className={`p-2 rounded-xl transition-all duration-300 ${activePage === 'videos' ? 'bg-purple-100' : ''}`}>
                            <Camera size={18} strokeWidth={activePage === 'videos' ? 2.5 : 2} />
                        </div>
                    </button>

                    {/* Center Button - New Campaign */}
                    <div className="flex justify-center -mt-8">
                        <button
                            type={'button'}
                            onClick={() => setActivePage('new')}
                            className="group relative"
                        >
                            <div className="absolute inset-0 bg-purple-600 blur-xl opacity-30 group-hover:opacity-50 transition-opacity rounded-full"></div>
                            <div className="h-14 w-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/30 transition-all duration-500 hover:rotate-90 active:scale-95">
                                <PlusCircle size={28} strokeWidth={2} className={activePage === 'new' ? 'animate-pulse' : ''} />
                            </div>
                        </button>
                    </div>

                    {/* Billing */}
                    <button type={'button'} onClick={() => setActivePage('billing')} className={getButtonStyle('billing')}>
                        <div className={`p-2 rounded-xl transition-all duration-300 ${activePage === 'billing' ? 'bg-purple-100' : ''}`}>
                            <Receipt size={18} strokeWidth={activePage === 'billing' ? 2.5 : 2} />
                        </div>
                    </button>

                    {/* Profile */}
                    <button type={'button'} onClick={() => setActivePage('profile')} className={getButtonStyle('profile')}>
                        <div className={`p-2 rounded-xl transition-all duration-300 ${activePage === 'profile' ? 'bg-purple-100' : ''}`}>
                            <User size={18} strokeWidth={activePage === 'profile' ? 2.5 : 2} />
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
}