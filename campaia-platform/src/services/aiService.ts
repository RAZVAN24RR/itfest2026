import { apiRequest } from './api';

export type ToneType = 'professional' | 'casual' | 'viral' | 'funny';
export type AIModelType = 'llama' | 'deepseek';

export interface ScriptGenerateRequest {
    product_description: string;
    product_url: string;
    tone?: ToneType;
    duration_seconds?: number;
    language?: 'en' | 'ro';
    variants?: number;
    ai_model?: AIModelType;
}

export interface ScriptGenerateResponse {
    scripts: string[];
    tokens_spent: number;
    tone: string;
    duration_seconds: number;
    language: string;
    variants_count: number;
    ai_model: string;
}

export interface HashtagGenerateRequest {
    product_description: string;
    count?: number;
    ai_model?: AIModelType;
}

export interface HashtagGenerateResponse {
    hashtags: string[];
    tokens_spent: number;
    ai_model: string;
}

export interface AudienceSuggestRequest {
    product_description: string;
    ai_model?: AIModelType;
}

export interface AudienceSuggestResponse {
    age_range: string;
    gender: string;
    interests: string[];
    locations: string[];
    description: string;
    tokens_spent: number;
    ai_model: string;
}

export interface MarketingDescriptionResponse {
    description: string;
    tokens_spent: number;
    ai_model: string;
}

export interface KlingPromptResponse {
    prompt: string;
    tokens_spent: number;
    ai_model: string;
}

export interface AIStatusResponse {
    available: boolean;
    models: Record<string, string>;
    provider: string;
}

export const AI_MODELS: { id: AIModelType; label: string; desc: string; badge: string; multiplier: number }[] = [
    { id: 'llama', label: 'Llama 3.2', desc: 'Fast & affordable', badge: '1x', multiplier: 1 },
    { id: 'deepseek', label: 'DeepSeek R1', desc: 'Premium reasoning', badge: '2x', multiplier: 2 },
];

export const AI_BASE_COSTS = {
    SCRIPT_GENERATION: 5,
    HASHTAG_GENERATION: 2,
    AUDIENCE_SUGGESTION: 3,
    MARKETING_DESCRIPTION: 5,
    KLING_PROMPT: 5,
};

export function getAICosts(model: AIModelType) {
    const m = AI_MODELS.find(x => x.id === model)?.multiplier ?? 1;
    return {
        SCRIPT_GENERATION: Math.ceil(AI_BASE_COSTS.SCRIPT_GENERATION * m),
        HASHTAG_GENERATION: Math.ceil(AI_BASE_COSTS.HASHTAG_GENERATION * m),
        AUDIENCE_SUGGESTION: Math.ceil(AI_BASE_COSTS.AUDIENCE_SUGGESTION * m),
        MARKETING_DESCRIPTION: Math.ceil(AI_BASE_COSTS.MARKETING_DESCRIPTION * m),
        KLING_PROMPT: Math.ceil(AI_BASE_COSTS.KLING_PROMPT * m),
    };
}

export const AI_COSTS = AI_BASE_COSTS;

export const getAIStatus = async (): Promise<AIStatusResponse> => {
    return apiRequest<AIStatusResponse>('/api/v1/ai/status');
};

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
            ai_model: data.ai_model || 'llama',
        }),
    });
};

export const generateHashtags = async (data: HashtagGenerateRequest): Promise<HashtagGenerateResponse> => {
    return apiRequest<HashtagGenerateResponse>('/api/v1/ai/generate-hashtags', {
        method: 'POST',
        body: JSON.stringify({
            product_description: data.product_description,
            count: data.count || 10,
            ai_model: data.ai_model || 'llama',
        }),
    });
};

export const suggestAudience = async (data: AudienceSuggestRequest): Promise<AudienceSuggestResponse> => {
    return apiRequest<AudienceSuggestResponse>('/api/v1/ai/suggest-audience', {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            ai_model: data.ai_model || 'llama',
        }),
    });
};

export const generateMarketingDescription = async (
    product_description: string,
    language: string = 'en',
    ai_model: AIModelType = 'llama',
): Promise<MarketingDescriptionResponse> => {
    return apiRequest<MarketingDescriptionResponse>('/api/v1/ai/generate-marketing-description', {
        method: 'POST',
        body: JSON.stringify({ product_description, language, ai_model }),
    });
};

export const generateKlingPrompt = async (
    product_description: string,
    language: string = 'en',
    ai_model: AIModelType = 'llama',
): Promise<KlingPromptResponse> => {
    return apiRequest<KlingPromptResponse>('/api/v1/ai/generate-kling-prompt', {
        method: 'POST',
        body: JSON.stringify({ product_description, language, ai_model }),
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
    AI_BASE_COSTS,
    AI_MODELS,
    getAICosts,
};
