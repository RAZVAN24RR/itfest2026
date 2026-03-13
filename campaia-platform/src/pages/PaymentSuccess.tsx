import { useEffect, useState } from 'react';
import { CheckCircle2, Coins, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import paymentService, { type WalletBalance } from '../services/paymentService';

export default function PaymentSuccess() {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [wallet, setWallet] = useState<WalletBalance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sessionId = searchParams.get('session_id');

    const content = {
        ro: {
            title: "Plată Reușită!",
            subtitle: "Tokenii au fost adăugați în contul tău.",
            balance: "Sold Curent",
            tokens: "tokens",
            backToDashboard: "Înapoi la Dashboard",
            buyMore: "Cumpără Mai Mulți Tokens",
            thankYou: "Îți mulțumim pentru achiziție! Poți folosi tokenii pentru a genera scripturi AI, imagini și videoclipuri pentru campaniile tale.",
            processing: "Se procesează plata...",
            errorTitle: "Ceva nu a mers bine",
            tryAgain: "Încearcă din nou"
        },
        en: {
            title: "Payment Successful!",
            subtitle: "Tokens have been added to your account.",
            balance: "Current Balance",
            tokens: "tokens",
            backToDashboard: "Back to Dashboard",
            buyMore: "Buy More Tokens",
            thankYou: "Thank you for your purchase! You can use tokens to generate AI scripts, images, and videos for your campaigns.",
            processing: "Processing payment...",
            errorTitle: "Something went wrong",
            tryAgain: "Try again"
        }
    };

    const t = content[language as keyof typeof content] || content.en;

    useEffect(() => {
        const verifyPayment = async () => {
            if (!sessionId) {
                // No session ID, just fetch wallet
                try {
                    const data = await paymentService.getWallet();
                    setWallet(data);
                } catch {
                    setError('Failed to load wallet');
                }
                setIsLoading(false);
                return;
            }

            try {
                // Verify session and add tokens
                const data = await paymentService.verifySession(sessionId);
                setWallet(data);
            } catch (err) {
                console.error('Failed to verify session:', err);
                // Fallback to just getting wallet
                try {
                    const data = await paymentService.getWallet();
                    setWallet(data);
                } catch {
                    setError('Failed to verify payment');
                }
            } finally {
                setIsLoading(false);
            }
        };

        verifyPayment();
    }, [sessionId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">{t.processing}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">{t.errorTitle}</h1>
                    <p className="text-slate-600 mb-8">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard?page=buyTokens')}
                        className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl"
                    >
                        {t.tryAgain}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                <div className="bg-white rounded-3xl shadow-2xl shadow-green-500/20 p-8 md:p-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30 animate-bounce">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>

                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t.title}</h1>
                    <p className="text-slate-500 text-lg mb-8">{t.subtitle}</p>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-8">
                        <p className="text-sm font-bold text-amber-700 uppercase mb-2">{t.balance}</p>
                        <div className="flex items-center justify-center gap-3">
                            <Coins className="w-10 h-10 text-amber-500" />
                            <span className="text-5xl font-extrabold text-amber-800">{wallet?.balance ?? 0}</span>
                            <span className="text-xl font-medium text-amber-600">{t.tokens}</span>
                        </div>
                    </div>

                    <p className="text-slate-600 text-sm mb-8 leading-relaxed">{t.thankYou}</p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2"
                        >
                            {t.backToDashboard}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate('/dashboard?page=buyTokens')}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                        >
                            {t.buyMore}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
