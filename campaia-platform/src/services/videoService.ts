/**
 * Campaia Platform - Video Service
 * 
 * Frontend service for AI video generation with Kling AI.
 */

import { apiRequest } from './api';

// Types
export type VideoDuration = '5' | '10';
export type VideoQuality = 'STANDARD' | 'PROFESSIONAL';
export type VideoStatus = 'PENDING' | 'PROCESSING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export interface VideoGenerateRequest {
    prompt: string;
    script?: string;
    campaign_id?: string;
    duration: VideoDuration;
    quality: VideoQuality;
}

export interface VideoGenerateResponse {
    id: string;
    status: VideoStatus;
    estimated_time_seconds: number;
    tokens_cost: number;
    message: string;
}

export interface VideoStatusResponse {
    id: string;
    status: VideoStatus;
    progress_percent: number;
    video_url: string | null;
    thumbnail_url: string | null;
    error_message: string | null;
    duration: string;
    quality: string;
    tokens_spent: number;
    created_at: string;
}

export interface VideoListItem {
    id: string;
    status: VideoStatus;
    video_url: string | null;
    thumbnail_url: string | null;
    duration: string;
    quality: string;
    prompt: string;
    tokens_spent: number;
    created_at: string;
    campaign_id: string | null;
    user_id?: string;
    title?: string;
}

export interface VideoListResponse {
    videos: VideoListItem[];
    total: number;
}

export interface VideoCostResponse {
    duration: string;
    quality: string;
    tokens: number;
    description: string;
}

/**
 * Get public community feed
 */
export const getFeed = async (
    limit: number = 20,
    offset: number = 0
): Promise<VideoListResponse> => {
    return apiRequest<VideoListResponse>(`/api/v1/video/feed?limit=${limit}&offset=${offset}`);
};

// Token costs
export const VIDEO_COSTS: Record<VideoDuration, Record<VideoQuality, number>> = {
    '5': {
        'STANDARD': 50,
        'PROFESSIONAL': 80,
    },
    '10': {
        'STANDARD': 80,
        'PROFESSIONAL': 150,
    },
};

/**
 * Get video token cost locally (for UI display)
 */
export const getVideoCost = (duration: VideoDuration, quality: VideoQuality): number => {
    return VIDEO_COSTS[duration][quality];
};

/**
 * Get video cost from API
 */
export const fetchVideoCost = async (
    duration: VideoDuration,
    quality: VideoQuality
): Promise<VideoCostResponse> => {
    return apiRequest<VideoCostResponse>(`/api/v1/video/cost?duration=${duration}&quality=${quality}`);
};

/**
 * Generate a new video
 */
export const generateVideo = async (
    request: VideoGenerateRequest
): Promise<VideoGenerateResponse> => {
    return apiRequest<VideoGenerateResponse>('/api/v1/video/generate', {
        method: 'POST',
        body: JSON.stringify(request),
    });
};

/**
 * Get video status (for polling)
 */
export const getVideoStatus = async (videoId: string): Promise<VideoStatusResponse> => {
    return apiRequest<VideoStatusResponse>(`/api/v1/video/${videoId}/status`);
};

/**
 * Get user's videos
 */
export const getVideos = async (
    campaignId?: string,
    limit: number = 20,
    offset: number = 0
): Promise<VideoListResponse> => {
    let url = `/api/v1/video/list?limit=${limit}&offset=${offset}`;
    if (campaignId) {
        url += `&campaign_id=${campaignId}`;
    }
    return apiRequest<VideoListResponse>(url);
};

/**
 * Delete a video
 */
export const deleteVideo = async (videoId: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/video/${videoId}`, {
        method: 'DELETE',
    });
};

/**
 * Check Kling AI availability
 */
export const checkKlingStatus = async (): Promise<{
    provider: string;
    available: boolean;
    models: string[];
    features: string[];
}> => {
    return apiRequest(`/api/v1/video/status/kling`);
};

/**
 * Video upload response
 */
export interface VideoUploadResponse {
    id: string;
    video_url: string;
    thumbnail_url: string | null;
    file_size_bytes: number;
    duration_seconds: number | null;
    message: string;
}

/**
 * Upload a user video (from gallery, camera, etc.)
 */
export const uploadVideo = async (
    file: File | Blob,
    options?: {
        title?: string;
        campaignId?: string;
        isPublic?: boolean;
    }
): Promise<VideoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'video.mp4');

    if (options?.title) {
        formData.append('title', options.title);
    }
    if (options?.campaignId) {
        formData.append('campaign_id', options.campaignId);
    }
    if (options?.isPublic !== undefined) {
        formData.append('is_public', options.isPublic.toString());
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('campaia_token');

    const response = await fetch(`${API_BASE_URL}/api/v1/video/upload`, {
        method: 'POST',
        headers: {
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
};

/**
 * Poll video status until complete or failed
 */
export const pollVideoStatus = async (
    videoId: string,
    onProgress: (status: VideoStatusResponse) => void,
    intervalMs: number = 5000,
    timeoutMs: number = 900000 // 15 minutes
): Promise<VideoStatusResponse> => {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const poll = async () => {
            try {
                const status = await getVideoStatus(videoId);
                onProgress(status);

                if (status.status === 'COMPLETED') {
                    resolve(status);
                    return;
                }

                if (status.status === 'FAILED') {
                    reject(new Error(status.error_message || 'Video generation failed'));
                    return;
                }

                if (Date.now() - startTime > timeoutMs) {
                    reject(new Error('Video generation timed out'));
                    return;
                }

                // Continue polling
                setTimeout(poll, intervalMs);
            } catch (error) {
                reject(error);
            }
        };

        poll();
    });
};

export default {
    generateVideo,
    getVideoStatus,
    getVideos,
    fetchVideoCost,
    getVideoCost,
    checkKlingStatus,
    pollVideoStatus,
    uploadVideo,
    deleteVideo,
    VIDEO_COSTS,
};

