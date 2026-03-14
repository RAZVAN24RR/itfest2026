/**
 * Campaia Platform - Video Gallery Component
 * 
 * Displays user's generated videos with preview, status, and actions.
 * Design consistent with existing dashboard (white bg, Tailwind CSS).
 */

import React, { useState, useEffect } from 'react';
import { Clock, Loader2, AlertCircle, CheckCircle2, Video, Sparkles, Play, Trash2, Eye } from 'lucide-react';
import { getVideos, deleteVideo, type VideoListItem, type VideoStatus } from '../services/videoService';
import VideoPreviewModal from './VideoPreviewModal';
import VideoThumbnail from './VideoThumbnail';

interface VideoGalleryProps {
    campaignId?: string;
    onVideoSelect?: (video: VideoListItem) => void;
    refreshTrigger?: number;
}

const VideoGallery: React.FC<VideoGalleryProps> = ({
    campaignId,
    onVideoSelect,
    refreshTrigger,
}) => {
    const [videos, setVideos] = useState<VideoListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<VideoListItem | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const response = await getVideos(campaignId, 50, 0);
            setVideos(response.videos);
            setError(null);
        } catch (err) {
            setError('Nu am putut încărca videoclipurile');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVideo = async (video: VideoListItem) => {
        if (!window.confirm('Ești sigur că vrei să ștergi acest videoclip? această acțiune este ireversibilă.')) return;

        try {
            await deleteVideo(video.id);
            setVideos(prev => prev.filter(v => v.id !== video.id));
            setIsPreviewOpen(false);
            setSelectedVideo(null);
        } catch (err) {
            alert('A apărut o eroare la ștergerea videoclipului');
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [campaignId, refreshTrigger]);

    const getStatusConfig = (status: VideoStatus) => {
        const configs: Record<VideoStatus, { icon: React.ReactNode; label: string; bgColor: string; textColor: string }> = {
            PENDING: {
                icon: <Clock className="w-3 h-3" />,
                label: 'În așteptare',
                bgColor: 'bg-amber-100',
                textColor: 'text-amber-700'
            },
            PROCESSING: {
                icon: <Loader2 className="w-3 h-3 animate-spin" />,
                label: 'Procesare',
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-700'
            },
            UPLOADING: {
                icon: <Sparkles className="w-3 h-3" />,
                label: 'Încărcare',
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-700'
            },
            COMPLETED: {
                icon: <CheckCircle2 className="w-3 h-3" />,
                label: 'Finalizat',
                bgColor: 'bg-green-100',
                textColor: 'text-green-700'
            },
            FAILED: {
                icon: <AlertCircle className="w-3 h-3" />,
                label: 'Eroare',
                bgColor: 'bg-red-100',
                textColor: 'text-red-700'
            },
        };
        return configs[status];
    };

    const handlePreviewClick = (video: VideoListItem) => {
        if (video.status === 'COMPLETED') {
            setSelectedVideo(video);
            setIsPreviewOpen(true);
        }
    };

    const handleVideoClick = (video: VideoListItem) => {
        if (video.status === 'COMPLETED') {
            if (onVideoSelect) {
                // If in selection mode, select it directly
                onVideoSelect(video);
            } else {
                // If no selection mode (just gallery), preview it
                handlePreviewClick(video);
            }
        }
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
        // Delay clearing the video to allow for close animation
        setTimeout(() => setSelectedVideo(null), 200);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                <p className="text-slate-500">Se încarcă videoclipurile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <p className="text-slate-700 font-medium mb-2">{error}</p>
                <button
                    onClick={fetchVideos}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                    Reîncearcă
                </button>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Video className="w-16 h-16 text-slate-300 mb-4" />
                <h4 className="text-xl font-bold text-slate-700 mb-2">Niciun videoclip generat</h4>
                <p className="text-slate-500">Videoclipurile generate vor apărea aici</p>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <Play className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Galerie Video</h3>
                        <p className="text-sm text-slate-500">{videos.length} videoclip(uri)</p>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((video) => {
                    const statusConfig = getStatusConfig(video.status);
                    const isCompleted = video.status === 'COMPLETED';

                    return (
                        <div
                            key={video.id}
                            onClick={() => handleVideoClick(video)}
                            className={`group bg-white border-2 rounded-2xl overflow-hidden transition-all ${isCompleted
                                ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-purple-300 border-slate-200'
                                : 'border-slate-100'
                                }`}
                        >
                            {/* Thumbnail - Only loads a static image, NOT the full video */}
                            <div className="relative aspect-[9/16] bg-slate-100">
                                {isCompleted && video.video_url ? (
                                    <VideoThumbnail
                                        src={video.video_url}
                                        thumbnailUrl={video.thumbnail_url}
                                        className="w-full h-full"
                                        aspectRatio=""
                                        onClick={() => handleVideoClick(video)}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                        <div className={`p-4 rounded-full ${statusConfig.bgColor}`}>
                                            {statusConfig.icon}
                                        </div>
                                    </div>
                                )}

                                {/* Duration Badge - Moved to Top-Left */}
                                <span className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg z-10 border border-white/10">
                                    {video.duration}s
                                </span>

                                {/* Status Badge - Keep Top-Right */}
                                <span className={`absolute top-2 right-2 ${statusConfig.bgColor} ${statusConfig.textColor} text-[10px] font-bold uppercase px-2 py-1 rounded-lg flex items-center gap-1 z-10 shadow-sm border border-black/5`}>
                                    {statusConfig.icon}
                                    {statusConfig.label}
                                </span>

                                {/* Action Buttons Overlay - Bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-t from-black/60 via-black/20 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    {/* View Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreviewClick(video);
                                        }}
                                        className="bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2 rounded-xl border border-white/20 transition-all active:scale-90"
                                        title="Previzualizare"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteVideo(video);
                                        }}
                                        className="bg-white/20 backdrop-blur-md hover:bg-red-500/80 text-white p-2 rounded-xl border border-white/20 transition-all active:scale-90"
                                        title="Șterge"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">
                                  {(() => {
                                    const pid = video.provider_used === 'UPLOAD' ? 'Upload' : (video.provider_used || video.provider_requested || 'KLING');
                                    const modelMap: Record<string, string> = { KLING: 'Kling v1.6', RUNWAY: 'Runway Gen-3 Alpha', PIKA: 'Pika 1.0', STABLE_VIDEO: 'ModelScope v1.7b', UPLOAD: 'Upload' };
                                    return modelMap[pid] || pid;
                                  })()}
                                  {video.fallback_used ? ' · fallback' : ''}
                                </p>
                                <p className="text-[10px] text-slate-400 mb-1">{video.duration}s · {video.aspect_ratio || '9:16'}</p>
                                <p className="text-sm text-slate-700 font-medium line-clamp-2 mb-2">
                                    {video.prompt}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>{video.quality}</span>
                                    <span>{video.tokens_spent} cr</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <VideoPreviewModal
                video={selectedVideo}
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
                onDelete={handleDeleteVideo}
                showActions={{ download: true, share: false, delete: true }}
            />
        </>
    );
};

export default VideoGallery;

