import { useEffect, useState } from 'react';
import { Coins, Loader2 } from 'lucide-react';
import paymentService, { type WalletBalance } from '../services/paymentService';

interface TokenBalanceProps {
    onClick?: () => void;
    className?: string;
}

export default function TokenBalance({ onClick, className = '' }: TokenBalanceProps) {
    const [wallet, setWallet] = useState<WalletBalance | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const data = await paymentService.getWallet();
                setWallet(data);
            } catch (error) {
                console.error('Failed to fetch wallet:', error);
                // Set default wallet on error
                setWallet({ balance: 0, lifetime_purchased: 0 });
            } finally {
                setIsLoading(false);
            }
        };

        fetchWallet();
    }, []);

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Loader2 className="animate-spin h-4 w-4 text-amber-600" />
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 transition-all ${className}`}
        >
            <Coins className="h-4 w-4 text-amber-600" />
            <span className="font-bold text-amber-800">{wallet?.balance ?? 0}</span>
            <span className="text-xs text-amber-600 font-medium">tokens</span>
        </button>
    );
}
