/**
 * Campaia Platform - Community Feed Component
 * 
 * Displays public videos from all users in a gallery format.
 * Can be used on dashboard and home page.
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Video, Users, Eye } from 'lucide-react';
import { getFeed, type VideoListItem } from '../services/videoService';
import VideoPreviewModal from './VideoPreviewModal';
import VideoThumbnail from './VideoThumbnail';

interface CommunityFeedProps {
    maxItems?: number;
    showHeader?: boolean;
    compact?: boolean;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({
    maxItems = 20,
    showHeader = true,
    compact = false,
}) => {
    const [videos, setVideos] = useState<VideoListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<VideoListItem | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getFeed(maxItems, 0);
            setVideos(response.videos);
        } catch (err) {
            console.error('Failed to load community feed:', err);
            setError('Nu am putut încărca feed-ul comunității');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [maxItems]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('ro-RO', {
            day: '2-digit',
            month: 'short',
        }).format(date);
    };

    const handleVideoClick = (video: VideoListItem) => {
        if (video.status === 'COMPLETED' && video.video_url) {
            setSelectedVideo(video);
            setIsPreviewOpen(true);
        }
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
        setTimeout(() => setSelectedVideo(null), 200);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
                <p className="text-slate-500 text-sm">Se încarcă...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
                <p className="text-slate-700 font-medium mb-2">{error}</p>
                <button
                    onClick={fetchVideos}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
                >
                    Reîncearcă
                </button>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="text-lg font-bold text-slate-700 mb-1">Comunitatea e liniștită</h4>
                <p className="text-slate-500 text-sm">Fii primul care creează un videoclip!</p>
            </div>
        );
    }

    return (
        <div>
            {showHeader && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-purple-500/20">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Comunitate</h3>
                            <p className="text-sm text-slate-500">Videoclipuri create de utilizatori</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Eye className="w-4 h-4" />
                        <span>{videos.length} videoclipuri</span>
                    </div>
                </div>
            )}

            {/* Video Grid */}
            <div className={`grid gap-4 ${compact ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                {videos.map((video) => (
                    <div
                        key={video.id}
                        onClick={() => handleVideoClick(video)}
                        className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all relative"
                    >
                        {/* Video Thumbnail - Static image, video loads in modal */}
                        <div className="aspect-[9/16] bg-slate-100 relative overflow-hidden">
                            {video.video_url ? (
                                <VideoThumbnail
                                    src={video.video_url}
                                    thumbnailUrl={video.thumbnail_url}
                                    className="w-full h-full"
                                    aspectRatio=""
                                    onClick={() => handleVideoClick(video)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                    <Video className="w-8 h-8 text-slate-400" />
                                </div>
                            )}

                            {/* Duration Badge */}
                            <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                                {video.duration}s
                            </span>

                            {/* Quality Badge */}
                            {video.quality === 'PROFESSIONAL' && (
                                <span className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                                    PRO
                                </span>
                            )}
                        </div>

                        {/* Info */}
                        {!compact && (
                            <div className="p-3">
                                <p className="text-xs text-slate-600 line-clamp-2 font-medium">{video.prompt}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{formatDate(video.created_at)}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Standardized Video Preview Modal */}
            <VideoPreviewModal
                video={selectedVideo}
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
                showActions={{ download: true, share: false, delete: false }}
            />
        </div>
    );
};

export default CommunityFeed;

