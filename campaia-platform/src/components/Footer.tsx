import {Sparkles} from "lucide-react";
import {Link} from "react-router-dom";
import {useLanguage} from "../context/LanguageContext.tsx";


export default function Footer()
{
    const languageContext = useLanguage();
    const language = languageContext ? languageContext.language : 'en';

    const content = {
        ro:{
            terms: "Termeni și Condiții",
            privacy: "Politica de Confidențialitate",
            f: "© 2025 Campaia Project. Lucrare de Licență."
        },
        en:{
            terms: "Terms of Service",
            privacy: "Privacy Policy",
            f: "© 2025 Campaia Project. Bachelor's Thesis."
        }
    }
    const text = content[language as keyof typeof content] || content.en;

    return(
        <footer className="bg-white py-12 border-t border-slate-50">
            <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <div className="bg-purple-600 p-1.5 rounded-lg">
                        <Sparkles className="h-4 w-4 text-white fill-white" />
                    </div>
                    <span className="font-bold text-xl text-blue-950 tracking-tight">Campaia</span>
                </div>
                <p className="text-sm text-slate-400 font-medium">
                   {text.f}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4">
                    <Link to="/terms" className="text-sm font-semibold text-slate-400 hover:text-purple-600 transition-colors">{text.terms}</Link>
                    <Link to="/privacy" className="text-sm font-semibold text-slate-400 hover:text-purple-600 transition-colors">{text.privacy}</Link>
                </div>
            </div>
        </footer>
    );
}