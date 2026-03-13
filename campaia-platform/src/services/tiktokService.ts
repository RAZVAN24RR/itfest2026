
import { apiRequest } from './api';

export interface TikTokStatus {
    connected: boolean;
    environment: string;
    advertiser_id?: string;
    advertiser_name?: string;
    balance: number;
    currency: string;
    status: string;
    error?: string;
}

export interface TikTokPublishResponse {
    success: boolean;
    tiktok_campaign_id?: string;
    tiktok_adgroup_id?: string;
    tiktok_ad_id?: string;
    error?: string;
}

class TikTokService {
    async getStatus(): Promise<TikTokStatus> {
        return apiRequest<TikTokStatus>('/api/v1/tiktok/status');
    }

    async publishCampaign(campaignId: string): Promise<TikTokPublishResponse> {
        return apiRequest<TikTokPublishResponse>('/api/v1/tiktok/publish', {
            method: 'POST',
            body: JSON.stringify({ campaign_id: campaignId })
        });
    }

    async getCampaigns(page: number = 1, pageSize: number = 20): Promise<any> {
        return apiRequest<any>(`/api/v1/tiktok/campaigns?page=${page}&page_size=${pageSize}`);
    }

    async getMetrics(days: number = 30): Promise<any> {
        return apiRequest<any>(`/api/v1/tiktok/metrics?days=${days}`);
    }
}

const tiktokService = new TikTokService();
export default tiktokService;
