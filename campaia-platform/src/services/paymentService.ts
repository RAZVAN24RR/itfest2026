import { apiRequest } from './api';

/**
 * Token package available for purchase
 */
export interface TokenPackage {
    id: string;
    tokens: number;
    price: number;
    currency: string;
    name: string;
}

/**
 * Wallet balance response
 */
export interface WalletBalance {
    balance: number;
    lifetime_purchased: number;
}

/**
 * Token transaction record
 */
export interface TokenTransaction {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    action_type: string | null;
    created_at: string;
}

/**
 * Checkout session creation request
 */
export interface CreateCheckoutRequest {
    package_id: string;
    success_url: string;
    cancel_url: string;
}

/**
 * Checkout session response
 */
export interface CheckoutSessionResponse {
    checkout_url: string;
}

/**
 * Invoice record
 */
export interface Invoice {
    id: string;
    invoice_number: string;
    invoice_type: string;
    status: string;
    amount: number;
    vat: number;
    total: number;
    currency: string;
    issued_at: string;
    pdf_url?: string;
}

/**
 * Invoice list response
 */
export interface InvoiceListResponse {
    items: Invoice[];
    total: number;
}

/**
 * Get available token packages
 */
export const getPackages = async (): Promise<TokenPackage[]> => {
    return apiRequest<TokenPackage[]>('/api/v1/payments/packages');
};

/**
 * Create Stripe checkout session
 */
export const createCheckoutSession = async (data: CreateCheckoutRequest): Promise<CheckoutSessionResponse> => {
    return apiRequest<CheckoutSessionResponse>('/api/v1/payments/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * Get current wallet balance
 */
export const getWallet = async (): Promise<WalletBalance> => {
    return apiRequest<WalletBalance>('/api/v1/payments/wallet');
};

/**
 * Get wallet transaction history
 */
export const getTransactions = async (limit: number = 50, offset: number = 0): Promise<TokenTransaction[]> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return apiRequest<TokenTransaction[]>(`/api/v1/payments/wallet/transactions?${params.toString()}`);
};

/**
 * Get user invoices
 */
export const getInvoices = async (): Promise<InvoiceListResponse> => {
    return apiRequest<InvoiceListResponse>('/api/v1/invoices');
};

/**
 * Get specific invoice details
 */
export const getInvoice = async (id: string): Promise<Invoice> => {
    return apiRequest<Invoice>(`/api/v1/invoices/${id}`);
};

/**
 * Redirect to Stripe checkout for purchasing tokens
 */
export const redirectToCheckout = async (packageId: string): Promise<void> => {
    const baseUrl = window.location.origin;

    const response = await createCheckoutSession({
        package_id: packageId,
        success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment/cancel`,
    });

    if (response.checkout_url) {
        window.location.href = response.checkout_url;
    }
};

/**
 * Verify and complete a checkout session (for development without webhooks)
 */
export const verifySession = async (sessionId: string): Promise<WalletBalance> => {
    return apiRequest<WalletBalance>(`/api/v1/payments/verify-session/${sessionId}`, {
        method: 'POST',
    });
};

export default {
    getPackages,
    createCheckoutSession,
    getWallet,
    getTransactions,
    getInvoices,
    getInvoice,
    redirectToCheckout,
    verifySession,
};
