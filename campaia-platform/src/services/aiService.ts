import { apiRequest } from './api';

/**
 * Tone types for script generation
 */
export type ToneType = 'professional' | 'casual' | 'viral' | 'funny';

/**
 * Request to generate script variants
 */
export interface ScriptGenerateRequest {
    product_description: string;
    product_url: string;
    tone?: ToneType;
    duration_seconds?: number;
    language?: 'en' | 'ro';
    variants?: number;
}

/**
 * Response with generated script variants
 */
export interface ScriptGenerateResponse {
    scripts: string[];
    tokens_spent: number;
    tone: string;
    duration_seconds: number;
    language: string;
    variants_count: number;
}

/**
 * Request to generate hashtags
 */
export interface HashtagGenerateRequest {
    product_description: string;
    count?: number;
}

/**
 * Response with generated hashtags
 */
export interface HashtagGenerateResponse {
    hashtags: string[];
    tokens_spent: number;
}

/**
 * Request to suggest audience
 */
export interface AudienceSuggestRequest {
    product_description: string;
}

/**
 * Response with audience suggestion
 */
export interface AudienceSuggestResponse {
    age_range: string;
    gender: string;
    interests: string[];
    locations: string[];
    description: string;
    tokens_spent: number;
}

/**
 * Marketing description response
 */
export interface MarketingDescriptionResponse {
    description: string;
    tokens_spent: number;
}

/**
 * Kling prompt response
 */
export interface KlingPromptResponse {
    prompt: string;
    tokens_spent: number;
}

/**
 * AI service status
 */
export interface AIStatusResponse {
    available: boolean;
    model: string;
    provider: string;
}

/**
 * Token costs for AI operations
 */
export const AI_COSTS = {
    SCRIPT_GENERATION: 5,
    HASHTAG_GENERATION: 2,
    AUDIENCE_SUGGESTION: 3,
    MARKETING_DESCRIPTION: 5,
    KLING_PROMPT: 5,
};

/**
 * Check AI service status
 */
export const getAIStatus = async (): Promise<AIStatusResponse> => {
    return apiRequest<AIStatusResponse>('/api/v1/ai/status');
};

/**
 * Generate TikTok ad script variants
 */
export const generateScript = async (data: ScriptGenerateRequest): Promise<ScriptGenerateResponse> => {
    return apiRequest<ScriptGenerateResponse>('/api/v1/ai/generate-script', {
        method: 'POST',
        body: JSON.stringify({
            product_description: data.product_description,
            product_url: data.product_url,
            tone: data.tone || 'viral',
            duration_seconds: data.duration_seconds || 15,
            language: data.language || 'en',
            variants: data.variants || 5,
        }),
    });
};

/**
 * Generate hashtags for a product
 */
export const generateHashtags = async (data: HashtagGenerateRequest): Promise<HashtagGenerateResponse> => {
    return apiRequest<HashtagGenerateResponse>('/api/v1/ai/generate-hashtags', {
        method: 'POST',
        body: JSON.stringify({
            product_description: data.product_description,
            count: data.count || 10,
        }),
    });
};

/**
 * Get AI-powered audience suggestions
 */
export const suggestAudience = async (data: AudienceSuggestRequest): Promise<AudienceSuggestResponse> => {
    return apiRequest<AudienceSuggestResponse>('/api/v1/ai/suggest-audience', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * Generate a short marketing description
 */
export const generateMarketingDescription = async (product_description: string, language: string = 'en'): Promise<MarketingDescriptionResponse> => {
    return apiRequest<MarketingDescriptionResponse>('/api/v1/ai/generate-marketing-description', {
        method: 'POST',
        body: JSON.stringify({ product_description, language }),
    });
};

/**
 * Generate a visual prompt for Kling AI
 */
export const generateKlingPrompt = async (product_description: string, language: string = 'en'): Promise<KlingPromptResponse> => {
    return apiRequest<KlingPromptResponse>('/api/v1/ai/generate-kling-prompt', {
        method: 'POST',
        body: JSON.stringify({ product_description, language }),
    });
};

export default {
    getAIStatus,
    generateScript,
    generateHashtags,
    suggestAudience,
    generateMarketingDescription,
    generateKlingPrompt,
    AI_COSTS,
};
