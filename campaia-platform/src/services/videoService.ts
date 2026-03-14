/**
 * Campaia Platform - Video Service (multi-provider + Kling fallback)
 */

import { apiRequest, getToken } from './api';

export type VideoDuration = '5' | '10';
export type VideoQuality = 'STANDARD' | 'PROFESSIONAL';
export type VideoStatus = 'PENDING' | 'PROCESSING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
export type VideoProvider = 'KLING' | 'RUNWAY' | 'PIKA' | 'STABLE_VIDEO';

export const VIDEO_STYLES: {
  id: VideoProvider;
  label: string;
  sub: string;
  mult: number;
}[] = [
  { id: 'KLING', label: 'Fast generation', sub: 'Quick, reliable clips', mult: 1 },
  { id: 'RUNWAY', label: 'Cinematic quality', sub: 'Rich, film-like look', mult: 1.35 },
  { id: 'PIKA', label: 'Social media style', sub: 'Trendy, vertical-ready', mult: 1 },
  { id: 'STABLE_VIDEO', label: 'Experimental / local AI', sub: 'Lower cost, beta', mult: 0.55 },
];

export interface VideoGenerateRequest {
  prompt: string;
  script?: string;
  campaign_id?: string;
  duration: VideoDuration;
  quality: VideoQuality;
  provider?: VideoProvider;
}

export interface VideoGenerateResponse {
  id: string;
  status: VideoStatus;
  estimated_time_seconds: number;
  tokens_cost: number;
  message: string;
  provider_requested: string;
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
  provider_requested?: string;
  provider_used?: string | null;
  fallback_used?: boolean;
  aspect_ratio?: string;
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
  title?: string | null;
  provider_requested?: string;
  provider_used?: string | null;
  fallback_used?: boolean;
  aspect_ratio?: string;
}

export interface VideoListResponse {
  videos: VideoListItem[];
  total: number;
}

const BASE_COSTS: Record<VideoDuration, Record<VideoQuality, number>> = {
  '5': { STANDARD: 50, PROFESSIONAL: 80 },
  '10': { STANDARD: 80, PROFESSIONAL: 150 },
};

export const getVideoCost = (
  duration: VideoDuration,
  quality: VideoQuality,
  provider: VideoProvider = 'KLING'
): number => {
  const base = BASE_COSTS[duration][quality];
  const mult = VIDEO_STYLES.find((s) => s.id === provider)?.mult ?? 1;
  return Math.max(15, Math.round(base * mult));
};

export const getFeed = async (
  limit = 20,
  offset = 0
): Promise<VideoListResponse> => {
  return apiRequest<VideoListResponse>(
    `/api/v1/video/feed?limit=${limit}&offset=${offset}`
  );
};

export const generateVideo = async (
  request: VideoGenerateRequest
): Promise<VideoGenerateResponse> => {
  return apiRequest<VideoGenerateResponse>('/api/v1/video/generate', {
    method: 'POST',
    body: JSON.stringify({
      ...request,
      provider: request.provider ?? 'KLING',
    }),
  });
};

export const getVideos = async (
  campaignId?: string,
  limit = 20,
  offset = 0
): Promise<VideoListResponse> => {
  const q = campaignId
    ? `campaign_id=${campaignId}&limit=${limit}&offset=${offset}`
    : `limit=${limit}&offset=${offset}`;
  return apiRequest<VideoListResponse>(`/api/v1/video/list?${q}`);
};

export const getVideoStatus = async (
  videoId: string
): Promise<VideoStatusResponse> => {
  return apiRequest<VideoStatusResponse>(`/api/v1/video/${videoId}/status`);
};

export const pollVideoStatus = async (
  videoId: string,
  onUpdate?: (s: VideoStatusResponse) => void,
  intervalMs = 5000,
  timeoutMs = 600000
): Promise<VideoStatusResponse> => {
  const start = Date.now();
  for (;;) {
    const s = await getVideoStatus(videoId);
    onUpdate?.(s);
    if (s.status === 'COMPLETED' || s.status === 'FAILED') return s;
    if (Date.now() - start > timeoutMs) throw new Error('Video generation timeout');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
};

export const deleteVideo = async (videoId: string): Promise<void> => {
  await apiRequest(`/api/v1/video/${videoId}`, { method: 'DELETE' });
};

export interface VideoUploadResponse {
  id: string;
  video_url: string;
  thumbnail_url?: string | null;
  file_size_bytes: number;
  message: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const uploadVideo = async (
  file: File,
  opts?: { title?: string; campaign_id?: string; is_public?: boolean }
): Promise<VideoUploadResponse> => {
  const form = new FormData();
  form.append('file', file);
  if (opts?.title) form.append('title', opts.title);
  if (opts?.campaign_id) form.append('campaign_id', opts.campaign_id);
  if (opts?.is_public !== undefined)
    form.append('is_public', String(opts.is_public));
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/video/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'ngrok-skip-browser-warning': 'true',
    },
    body: form,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.detail || `HTTP ${res.status}`);
  }
  return res.json();
};

const videoService = {
  getVideos: (campaignId?: string, limit?: number, offset?: number) =>
    getVideos(campaignId, limit, offset),
};
export default videoService;

export const updateVideoTitle = async (
  videoId: string,
  title: string
): Promise<void> => {
  await apiRequest(`/api/v1/video/${videoId}/title`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
};
