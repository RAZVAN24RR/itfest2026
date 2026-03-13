import { Wifi } from 'lucide-react';

interface CreditCardPreviewProps {
    cardNumber: string;
    cardHolder: string;
    expiry: string;
    cvc: string;
}

export default function CreditCardPreview({ cardNumber, cardHolder, expiry }: CreditCardPreviewProps) {

    // Formatare vizuală doar pentru afișare (nu modifică datele reale)
    const displayNum = cardNumber ? cardNumber : '•••• •••• •••• ••••';
    const displayHolder = cardHolder ? cardHolder.toUpperCase() : 'NUME TITULAR';
    const displayExpiry = expiry ? expiry : 'MM/YY';

    return (
        <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-blue-900/20 group perspective-1000 mx-auto max-w-[380px]">

            {/* --- BACKGROUND PREMIUM (Dark Glass) --- */}
            <div className="absolute inset-0 bg-slate-900">
                {/* Gradient-uri organice */}
                <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[100%] bg-purple-600/30 blur-[80px] rounded-full mix-blend-screen"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/30 blur-[60px] rounded-full mix-blend-screen"></div>

                {/* Noise Texture pentru realism */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>

                {/* Luciu sticlă */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50"></div>
            </div>

            {/* --- CONȚINUT CARD --- */}
            <div className="relative h-full p-6 flex flex-col justify-between text-white z-10">

                {/* Top Row: Chip & Wifi */}
                <div className="flex justify-between items-start">
                    <Wifi className="w-8 h-8 rotate-90 opacity-60" />
                    <span className="font-bold text-xs tracking-widest opacity-70 font-mono border border-white/20 px-2 py-1 rounded">CAMPAIA BANK</span>
                </div>

                {/* Card Number */}
                <div className="mt-2">
                    <div className="font-mono text-xl sm:text-2xl tracking-widest font-medium drop-shadow-md text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80">
                        {displayNum}
                    </div>
                </div>

                {/* Bottom Row: Details */}
                <div className="flex justify-between items-end mt-auto">
                    <div className="space-y-1">
                        <p className="text-[8px] uppercase tracking-widest text-purple-200 font-bold opacity-80">Card Holder</p>
                        <p className="font-mono text-sm sm:text-base font-bold tracking-wide uppercase text-white/90 truncate max-w-[180px]">
                            {displayHolder}
                        </p>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                        <p className="text-[8px] uppercase tracking-widest text-purple-200 font-bold opacity-80">Expires</p>
                        <p className="font-mono text-sm font-bold tracking-wide">
                            {displayExpiry}
                        </p>
                    </div>
                </div>

                {/* Mastercard/Visa Logo (CSS Only Shapes) */}
                <div className="absolute bottom-6 right-6 flex -space-x-3 opacity-80 mix-blend-overlay">
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm"></div>
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm"></div>
                </div>
            </div>
        </div>
    );
}