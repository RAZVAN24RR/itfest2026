import { XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function PaymentCancel() {
    const { language } = useLanguage();
    const navigate = useNavigate();

    const content = {
        ro: {
            title: "Plată Anulată",
            subtitle: "Tranzacția a fost anulată și nu s-a efectuat nicio plată.",
            backToDashboard: "Înapoi la Dashboard",
            tryAgain: "Încearcă Din Nou",
            info: "Dacă ai întâmpinat probleme, poți încerca din nou sau ne poți contacta pentru asistență."
        },
        en: {
            title: "Payment Cancelled",
            subtitle: "The transaction was cancelled and no payment was made.",
            backToDashboard: "Back to Dashboard",
            tryAgain: "Try Again",
            info: "If you encountered any issues, you can try again or contact us for assistance."
        }
    };

    const t = content[language as keyof typeof content] || content.en;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-500/10 p-8 md:p-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <XCircle className="w-12 h-12 text-white" />
                    </div>

                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t.title}</h1>
                    <p className="text-slate-500 text-lg mb-8">{t.subtitle}</p>

                    <p className="text-slate-600 text-sm mb-8 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                        {t.info}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/dashboard?page=buyTokens')}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            {t.tryAgain}
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {t.backToDashboard}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
