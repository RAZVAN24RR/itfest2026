import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
    message: string | null;
    type?: NotificationType;
    isVisible: boolean;
    onClose: () => void;
}

export default function Notification({ message, type = 'success', isVisible, onClose }: NotificationProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
                >
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-full ${type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                            {type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                        </div>
                        <p className="flex-1 text-sm font-bold text-slate-700">{message}</p>
                        <button type={'button'} onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}