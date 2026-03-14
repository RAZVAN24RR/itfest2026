export interface CampaignData {
    id?: string;
    name?: string;
    date?: string;
    url: string;
    budget: number; // tokens per day - user starts/stops campaign manually
    productDesc: string;
    aiScript: string;
    marketingDescription?: string;
    klingPrompt?: string;
    isActive?: boolean;
    videoId?: string;
    targeting?: any;
    city?: string;
    lat?: number;
    lng?: number;
}