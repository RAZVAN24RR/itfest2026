import { useState, useEffect } from 'react';
import { Receipt, Calendar, Loader2 } from 'lucide-react';
import paymentService, { type Invoice } from '../../services/paymentService';
import { useLanguage } from '../../context/LanguageContext';
import InvoiceDownloadButton from './InvoiceDownloadButton';

export default function InvoiceList() {
    const { language } = useLanguage();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const t = {
        ro: {
            noInvoices: "Nu ai nicio factură încă.",
            date: "Data",
            number: "Nr. Factură",
            amount: "Sumă",
            status: "Status",
            type: "Tip",
            download: "Descarcă",
            individual: "Pers. Fizică",
            business: "Firmă",
            paid: "Plătită"
        },
        en: {
            noInvoices: "No invoices yet.",
            date: "Date",
            number: "Invoice No.",
            amount: "Amount",
            status: "Status",
            type: "Type",
            download: "Download",
            individual: "Individual",
            business: "Business",
            paid: "Paid"
        }
    }[language === 'ro' ? 'ro' : 'en'];

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            const data = await paymentService.getInvoices();
            setInvoices(data?.items || []);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[400px]">
                <Loader2 className="animate-spin h-10 w-10 text-purple-600" />
            </div>
        );
    }

    if (!invoices || invoices.length === 0) {
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
                    <Receipt size={40} />
                </div>
                <p className="text-xl font-black text-slate-400 uppercase tracking-widest">{t.noInvoices}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.number}</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.date}</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.type}</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">{t.amount}</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t.status}</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-8 py-6">
                                <span className="font-mono text-sm font-bold text-slate-900">{invoice.invoice_number}</span>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                    <Calendar size={14} className="text-slate-400" />
                                    {formatDate(invoice.issued_at)}
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${invoice.invoice_type === 'BUSINESS'
                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                    {invoice.invoice_type === 'BUSINESS' ? t.business : t.individual}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <span className="font-black text-slate-900 text-lg tabular-nums">
                                    {Number(invoice.total || 0).toFixed(2)}
                                    <span className="text-xs text-slate-400 font-bold uppercase ml-1">
                                        {invoice.currency}
                                    </span>
                                </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                                <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 max-w-fit mx-auto shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm" />
                                    {t.paid}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <InvoiceDownloadButton
                                    invoiceId={invoice.id}
                                    invoiceNumber={invoice.invoice_number}
                                    variant="full"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
