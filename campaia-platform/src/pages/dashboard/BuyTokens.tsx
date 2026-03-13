import { useState, useEffect } from 'react';
import { Coins, Sparkles, Zap, Crown, Rocket, Loader2, Check, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import paymentService, { type TokenPackage, type WalletBalance } from '../../services/paymentService';

export default function BuyTokens() {
    const { language } = useLanguage();
    const [packages, setPackages] = useState<TokenPackage[]>([]);
    const [wallet, setWallet] = useState<WalletBalance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    const content = {
        ro: {
            title: "Reîncarcă Portofelul",
            subtitle: "Alege puterea de procesare AI de care ai nevoie pentru campaniile tale.",
            balance: "Tokens Disponibili",
            tokens: "tokens",
            buy: "Cumpără Acum",
            popular: "Cea mai populară",
            bestValue: "Cea mai bună valoare",
            perToken: "/ token",
            features: {
                starter: ["100 tokens credit", "Acces scripturi AI", "Suport Standard"],
                standard: ["300 tokens credit", "Generare imagini AI", "Prioritate la rendere"],
                pro: ["700 tokens credit", "Video 5s AI HD", "Bonus 50 tokens cadou"],
                business: ["1500 tokens credit", "Video 10s Ultra HD", "Manager de cont dedicat"]
            }
        },
        en: {
            title: "Refill Your Wallet",
            subtitle: "Choose the AI processing power you need for your viral campaigns.",
            balance: "Available Tokens",
            tokens: "tokens",
            buy: "Purchase Now",
            popular: "Most Popular",
            bestValue: "Best Value",
            perToken: "/ token",
            features: {
                starter: ["100 credit tokens", "AI Script Access", "Standard Support"],
                standard: ["300 credit tokens", "AI Image Generation", "Rendering Priority"],
                pro: ["700 credit tokens", "5s HD AI Video", "Bonus 50 tokens gift"],
                business: ["1500 credit tokens", "10s Ultra HD Video", "Dedicated Manager"]
            }
        }
    };

    const t = content[language as keyof typeof content] || content.en;

    const packageIcons: Record<string, React.ReactNode> = {
        starter: <Sparkles className="w-8 h-8" />,
        standard: <Zap className="w-8 h-8" />,
        pro: <Crown className="w-8 h-8" />,
        business: <Rocket className="w-8 h-8" />,
    };

    const packageColors: Record<string, string> = {
        starter: "from-slate-700 to-slate-900 shadow-slate-200",
        standard: "from-purple-600 to-indigo-700 shadow-purple-200",
        pro: "from-indigo-600 to-violet-700 shadow-indigo-200",
        business: "from-amber-500 to-orange-600 shadow-orange-200",
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [packagesData, walletData] = await Promise.all([
                    paymentService.getPackages(),
                    paymentService.getWallet(),
                ]);
                setPackages(packagesData);
                setWallet(walletData);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePurchase = async (packageId: string) => {
        setPurchasingId(packageId);
        try {
            await paymentService.redirectToCheckout(packageId);
        } catch (error) {
            console.error('Failed to create checkout:', error);
            setPurchasingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Incarcam ofertele...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header with Balance */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32 opacity-40"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight lg:text-5xl">{t.title}</h1>
                    <p className="text-slate-500 mt-3 text-lg font-medium max-w-xl">{t.subtitle}</p>
                </div>

                <div className="relative z-10 bg-slate-900 rounded-[2rem] p-6 sm:p-8 flex items-center gap-6 shadow-2xl shadow-slate-950/20">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Coins className="w-9 h-9 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t.balance}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white tracking-tight">{wallet?.balance ?? 0}</span>
                            <span className="text-xs font-black text-amber-500 uppercase">{t.tokens}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {packages.map((pkg) => {
                    const pricePerToken = (pkg.price / pkg.tokens).toFixed(2);
                    const isPopular = pkg.id === 'standard';
                    const isBestValue = pkg.id === 'business';
                    const features = t.features[pkg.id as keyof typeof t.features] || [];

                    return (
                        <div
                            key={pkg.id}
                            className={`group relative bg-white rounded-[2.5rem] p-8 border-2 transition-all duration-300 flex flex-col hover:-translate-y-2
                                ${isPopular
                                    ? 'border-purple-600 shadow-2xl shadow-purple-500/10'
                                    : 'border-transparent shadow-xl shadow-slate-200/50 hover:border-slate-200'}`}
                        >
                            {/* Tags */}
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                    <span className="bg-purple-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-lg shadow-purple-500/30 tracking-widest whitespace-nowrap">
                                        🚀 {t.popular}
                                    </span>
                                </div>
                            )}
                            {isBestValue && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                    <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-lg tracking-widest whitespace-nowrap">
                                        💎 {t.bestValue}
                                    </span>
                                </div>
                            )}

                            {/* Package Icon */}
                            <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${packageColors[pkg.id]} flex items-center justify-center text-white mb-8 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                                {packageIcons[pkg.id]}
                            </div>

                            {/* Title & Price */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-900 mb-1">{pkg.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{pricePerToken} RON</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{t.perToken}</span>
                                </div>
                            </div>

                            <div className="mb-8 p-6 bg-slate-50 rounded-[1.5rem] group-hover:bg-slate-100/50 transition-colors">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{pkg.price}</span>
                                    <span className="text-lg font-black text-slate-400 uppercase">Ron</span>
                                </div>
                            </div>

                            {/* Features List */}
                            <ul className="space-y-4 mb-10 flex-1">
                                {features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 font-medium leading-tight">
                                        <div className="mt-0.5 bg-green-500 rounded-full p-0.5 text-white">
                                            <Check className="w-3 h-3" strokeWidth={4} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button
                                type="button"
                                onClick={() => handlePurchase(pkg.id)}
                                disabled={purchasingId !== null}
                                className={`w-full relative group/btn overflow-hidden py-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 active:scale-95
                                    ${isPopular
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-black'
                                        : 'bg-white border-2 border-slate-100 text-slate-900 hover:border-slate-300'
                                    } disabled:opacity-50`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                                {purchasingId === pkg.id ? (
                                    <Loader2 className="animate-spin h-6 w-6" />
                                ) : (
                                    <>
                                        {t.buy}
                                        <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

