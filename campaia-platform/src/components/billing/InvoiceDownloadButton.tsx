import { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import paymentService from '../../services/paymentService';

interface InvoiceDownloadButtonProps {
    invoiceId: string;
    invoiceNumber: string;
    variant?: 'icon' | 'full';
}

export default function InvoiceDownloadButton({
    invoiceId,
    invoiceNumber,
    variant = 'icon'
}: InvoiceDownloadButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const invoice = await paymentService.getInvoice(invoiceId);
            if (invoice.pdf_url) {
                // Open in new tab for download
                window.open(invoice.pdf_url, '_blank');
            } else {
                alert("Factura se generează încă. Vă rugăm să reîncercați în câteva secunde.");
            }
        } catch (error) {
            console.error('Failed to get download URL:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50"
                title={`Descarcă factura ${invoiceNumber}`}
            >
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
        );
    }

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:text-purple-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
        >
            {isDownloading ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <FileText size={14} />
            )}
            PDF
        </button>
    );
}
