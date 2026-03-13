import { User, Bell, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Settings() {
    const { language } = useLanguage();

    const texts = {
        ro: {
            title: "Configurări",
            subtitle: "Personalizează experiența ta pe platforma Campaia.",
            profile: "Profil Personal",
            profileDesc: "Gestionează informațiile de bază și identitatea vizuală.",
            notifications: "Centru Notificări",
            notificationsDesc: "Configurări pentru alerte email, push și actualizări.",
            security: "Siguranță și Acces",
            securityDesc: "Securizează-ți contul cu parolă și autentificare 2FA."
        },
        en: {
            title: "Settings",
            subtitle: "Personalize your experience on the Campaia platform.",
            profile: "Personal Profile",
            profileDesc: "Manage basic information and visual identity.",
            notifications: "Notification Center",
            notificationsDesc: "Configure email alerts, push, and updates.",
            security: "Security & Access",
            securityDesc: "Secure your account with passwords and 2FA."
        }
    };

    const t = language === 'ro' ? texts.ro : texts.en;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight lg:text-5xl">{t.title}</h1>
                <p className="text-slate-500 mt-2 text-lg font-medium">{t.subtitle}</p>
            </div>

            <div className="grid gap-6">
                {[
                    { icon: User, label: t.profile, desc: t.profileDesc },
                    { icon: Bell, label: t.notifications, desc: t.notificationsDesc },
                    { icon: Lock, label: t.security, desc: t.securityDesc }
                ].map((item, idx) => (
                    <div key={idx} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between gap-6 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-8">
                            <div className="bg-slate-900 p-5 rounded-2xl text-purple-400 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-slate-900/10">
                                <item.icon size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{item.label}</h3>
                                <p className="text-slate-500 font-medium mt-1">{item.desc}</p>
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}