import { useState, useEffect } from 'react';
import { Coins, History, ArrowUpRight, ArrowDownRight, Loader2, Receipt, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import paymentService, { type WalletBalance, type TokenTransaction, type TokenPackage } from '../../services/paymentService';
import InvoiceList from '../../components/billing/InvoiceList';

export default function Billing() {
    const { language } = useLanguage();
    const [wallet, setWallet] = useState<WalletBalance | null>(null);
    const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
    const [packages, setPackages] = useState<TokenPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    const content = {
        ro: {
            title: "Tokens & Plăți",
            subtitle: "Gestionează tokenii și vizualizează istoricul plăților.",
            balance: "Sold Curent",
            lifetime: "Total Cumpărat",
            tokens: "tokens",
            buyTokens: "Cumpără Tokens",
            history: "Istoric Tranzacții",
            noTransactions: "Nu ai nicio tranzacție încă.",
            purchase: "Achiziție",
            spend: "Utilizare",
            refund: "Rambursare",
            packages: "Pachete Disponibile",
            buy: "Cumpără",
            perToken: "/ token",
            popular: "Populară"
        },
        en: {
            title: "Tokens & Payments",
            subtitle: "Manage your tokens and view payment history.",
            balance: "Current Balance",
            lifetime: "Lifetime Purchased",
            tokens: "tokens",
            buyTokens: "Buy Tokens",
            history: "Transaction History",
            noTransactions: "No transactions yet.",
            purchase: "Purchase",
            spend: "Spend",
            refund: "Refund",
            packages: "Available Packages",
            buy: "Buy",
            perToken: "/ token",
            popular: "Popular"
        }
    };

    const t = content[language as keyof typeof content] || content.en;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletData, transactionsData, packagesData] = await Promise.all([
                    paymentService.getWallet(),
                    paymentService.getTransactions(20),
                    paymentService.getPackages(),
                ]);
                setWallet(walletData);
                setTransactions(transactionsData);
                setPackages(packagesData);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'PURCHASE':
                return <ArrowUpRight className="w-4 h-4 text-green-500" />;
            case 'SPEND':
                return <ArrowDownRight className="w-4 h-4 text-orange-500" />;
            case 'REFUND':
                return <ArrowUpRight className="w-4 h-4 text-purple-500" />;
            default:
                return <History className="w-4 h-4 text-slate-400" />;
        }
    };

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case 'PURCHASE':
                return t.purchase;
            case 'SPEND':
                return t.spend;
            case 'REFUND':
                return t.refund;
            default:
                return type;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight lg:text-5xl">{t.title}</h1>
                <p className="text-slate-500 mt-2 text-lg font-medium">{t.subtitle}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                <Coins className="w-8 h-8 text-amber-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.balance}</p>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <p className="text-6xl font-black tabular-nums">{wallet?.balance ?? 0}</p>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.tokens}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-purple-600">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.lifetime}</p>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <p className="text-6xl font-black text-slate-900 tabular-nums">{wallet?.lifetime_purchased ?? 0}</p>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.tokens}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Buy Packages */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-2 bg-slate-50 self-start rounded-xl border border-slate-100 max-w-fit">
                    <Sparkles size={20} className="text-purple-600" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">{t.packages}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {packages.map((pkg) => {
                        const pricePerToken = (pkg.price / pkg.tokens).toFixed(2);
                        const isPopular = pkg.id === 'standard';

                        return (
                            <div
                                key={pkg.id}
                                className={`group relative bg-white border-2 rounded-[2.5rem] p-8 transition-all duration-500 ${isPopular ? 'border-purple-600 shadow-2xl shadow-purple-500/10 scale-105 z-10' : 'border-slate-50 shadow-xl shadow-slate-200/40 hover:-translate-y-2'
                                    }`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-xl">
                                        {t.popular}
                                    </div>
                                )}
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{pkg.name}</p>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <p className="text-4xl font-black text-slate-900 tabular-nums">{pkg.tokens}</p>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">tk</span>
                                </div>
                                <p className="text-xs font-bold text-purple-600 mb-8">{pricePerToken} RON {t.perToken}</p>

                                <button
                                    onClick={() => handlePurchase(pkg.id)}
                                    disabled={purchasingId !== null}
                                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${isPopular
                                        ? 'bg-slate-900 text-purple-400 hover:bg-black hover:text-white shadow-slate-900/20'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        } disabled:opacity-50`}
                                >
                                    {purchasingId === pkg.id ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : (
                                        <>
                                            {pkg.price} RON
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* History Grid (Invoices & Activity) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Side: Invoices (Main column) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-4 p-2 bg-slate-50 self-start rounded-xl border border-slate-100 max-w-fit">
                        <Receipt size={20} className="text-indigo-600" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">{t.history}</h2>
                    </div>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[400px]">
                        <InvoiceList />
                    </div>
                </div>

                {/* Right Side: Token Activity (Sidebar column) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-2 bg-slate-50 self-start rounded-xl border border-slate-100 max-w-fit">
                        <Clock size={20} className="text-amber-600" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Token Activity</h2>
                    </div>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col h-[600px]">
                        <div className="overflow-y-auto flex-1 divide-y divide-slate-50 custom-scrollbar">
                            {transactions.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                                    <div className="bg-slate-50 p-6 rounded-3xl mb-6 text-slate-200">
                                        <History className="w-12 h-12" />
                                    </div>
                                    <p className="text-lg font-black text-slate-400 uppercase tracking-widest">{t.noTransactions}</p>
                                </div>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                                        <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                            {getTransactionIcon(tx.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-900 text-[11px] uppercase tracking-wider mb-1 leading-tight">
                                                {tx.description || getTransactionLabel(tx.type)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${tx.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {getTransactionLabel(tx.type)}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(tx.created_at).split(',')[0]}</span>
                                            </div>
                                        </div>
                                        <div className={`text-right font-black text-lg tabular-nums flex-shrink-0 ${tx.amount > 0 ? 'text-green-600' : 'text-slate-900'
                                            }`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            <span className="text-[8px] text-slate-400 uppercase tracking-widest ml-1">tk</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}