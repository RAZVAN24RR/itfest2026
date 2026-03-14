import { apiRequest } from './api';

export interface AudienceTarget {
    id?: string;
    campaign_id: string;
    countries: string[];
    regions: string[];
    cities: string[];
    age_min: number;
    age_max: number;
    genders: string[];
    interests: string[];
    languages: string[];
    devices: string[];
    // TikTok API fields (used after conversion)
    location_ids?: string[];
    age_groups?: string[];
    gender?: string;
    city?: string;
    lat?: number;
    lng?: number;
}

export interface Location {
    code?: string;
    id?: string;
    name: string;
}

const targetingService = {
    getTargeting: async (campaignId: string): Promise<AudienceTarget> => {
        return apiRequest<AudienceTarget>(`/api/v1/targeting/${campaignId}`);
    },

    updateTargeting: async (campaignId: string, data: Partial<AudienceTarget>): Promise<AudienceTarget> => {
        return apiRequest<AudienceTarget>(`/api/v1/targeting/${campaignId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getCountries: async (lang: string = 'en'): Promise<Location[]> => {
        return apiRequest<Location[]>(`/api/v1/targeting/locations/countries?language=${lang}`);
    },

    getRegions: async (country: string, lang: string = 'en'): Promise<Location[]> => {
        return apiRequest<Location[]>(`/api/v1/targeting/locations/regions?country=${country}&language=${lang}`);
    },

    getInterests: async (lang: string = 'en'): Promise<string[]> => {
        return apiRequest<string[]>(`/api/v1/targeting/interests?language=${lang}`);
    }
};

export default targetingService;
