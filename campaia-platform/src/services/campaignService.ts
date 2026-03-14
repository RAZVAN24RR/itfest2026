import { apiRequest } from './api';

export const CampaignStatus = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
} as const;

export type CampaignStatus = typeof CampaignStatus[keyof typeof CampaignStatus];

export interface Campaign {
    id: string;
    user_id: string;
    name: string | null;
    url: string;
    budget: number;
    product_desc: string | null;
    ai_script: string | null;
    status: CampaignStatus;
    tokens_spent: number;
    target_audience_id: string | null;
    tiktok_ad_id: string | null;
    tiktok_campaign_id: string | null;
    video_url: string | null;
    video_id: string | null;
    event_type: string | null;
    lat: number | null;
    lng: number | null;
    city: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateCampaignData {
    url: string;
    budget?: number;
    product_desc?: string;
    name?: string;
    event_type?: string;
    lat?: number;
    lng?: number;
    city?: string;
}

export interface UpdateCampaignData {
    name?: string | null;
    url?: string | null;
    budget?: number | null;
    product_desc?: string | null;
    ai_script?: string | null;
    status?: CampaignStatus | null;
    lat?: number | null;
    lng?: number | null;
    city?: string | null;
}

export interface CampaignListResponse {
    items: Campaign[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
}

export interface CampaignFilters {
    page?: number;
    per_page?: number;
    status?: CampaignStatus;
    search?: string;
}

export interface CampaignMapMarker {
    id: string;
    title: string;
    lat: number;
    lng: number;
    city?: string;
    category: string;
    estimated_reach: number;
    video_url: string | null;
}

/**
 * Get all campaigns with optional filtering
 */
export const getCampaigns = async (filters: CampaignFilters = {}): Promise<CampaignListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = `/api/v1/campaigns${queryString ? `?${queryString}` : ''}`;

    return apiRequest<CampaignListResponse>(endpoint);
};

/**
 * Get a single campaign by ID
 */
export const getCampaign = async (id: string): Promise<Campaign> => {
    return apiRequest<Campaign>(`/api/v1/campaigns/${id}`);
};

/**
 * Create a new campaign
 */
export const createCampaign = async (data: CreateCampaignData): Promise<Campaign> => {
    return apiRequest<Campaign>('/api/v1/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * Update a campaign
 */
export const updateCampaign = async (id: string, data: UpdateCampaignData): Promise<Campaign> => {
    return apiRequest<Campaign>(`/api/v1/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

/**
 * Delete a campaign
 */
export const deleteCampaign = async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/campaigns/${id}`, {
        method: 'DELETE',
    });
};

/**
 * Pause a campaign
 */
export const pauseCampaign = async (id: string): Promise<Campaign> => {
    return apiRequest<Campaign>(`/api/v1/campaigns/${id}/pause`, {
        method: 'POST',
    });
};

/**
 * Resume a campaign
 */
export const resumeCampaign = async (id: string): Promise<Campaign> => {
    return apiRequest<Campaign>(`/api/v1/campaigns/${id}/resume`, {
        method: 'POST',
    });
};

/**
 * Activate a campaign (Draft -> Active)
 */
export const activateCampaign = async (id: string): Promise<Campaign> => {
    return apiRequest<Campaign>(`/api/v1/campaigns/${id}/activate`, {
        method: 'POST',
    });
};

export interface CampaignScriptUpdate {
    ai_script: string;
    tokens_spent?: number;
}

/**
 * Update AI Script for a campaign
 */
export const updateScript = async (id: string, data: CampaignScriptUpdate): Promise<Campaign> => {
    return apiRequest<Campaign>(`/api/v1/campaigns/${id}/script`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * Get map markers
 */
export const getMapMarkers = async (): Promise<CampaignMapMarker[]> => {
    return apiRequest<CampaignMapMarker[]>('/api/v1/campaigns/map');
};


export default {
    getCampaigns,
    getCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    pauseCampaign,
    resumeCampaign,
    activateCampaign,
    updateScript,
    getMapMarkers,
};
