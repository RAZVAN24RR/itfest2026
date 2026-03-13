import NavbarPublic from "./navbar/NavbarPublic.tsx";
import NavbarDashboard from "./navbar/NavbarDashboard.tsx";

interface NavbarProps {
    type?: 'public' | 'dashboard';
    onNavigate?: (page: 'billing' | 'settings') => void;
}

export default function Navbar({ type = 'public', onNavigate }: NavbarProps) {
    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-slate-100 bg-white/90 backdrop-blur-xl transition-all supports-[backdrop-filter]:bg-white/60 pb-5">
                {type === 'dashboard' ? (
                    <NavbarDashboard onNavigate={onNavigate} />
                ) : (
                    <NavbarPublic />
                )}
            </header>

            <div className="h-28 lg:h-16 w-full" aria-hidden="true" />
        </>
    );
}