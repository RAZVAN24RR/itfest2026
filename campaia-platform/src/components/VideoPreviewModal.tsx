/**
 * Campaia Platform - Video Preview Modal Component
 * 
 * Standardized modal for viewing/previewing videos across the platform.
 * Reusable component with consistent design and functionality.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Download, Video, Sparkles, Clock, Share2, Trash2, Play, Loader2 } from 'lucide-react';
import type { VideoListItem } from '../services/videoService';

interface VideoPreviewModalProps {
    video: VideoListItem | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload?: (video: VideoListItem) => void;
    onShare?: (video: VideoListItem) => void;
    onDelete?: (video: VideoListItem) => void;
    showActions?: {
        download?: boolean;
        share?: boolean;
        delete?: boolean;
    };
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
    video,
    isOpen,
    onClose,
    onDownload,
    onShare,
    onDelete,
    showActions = { download: true, share: false, delete: false },
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [isBuffering, setIsBuffering] = useState(true);

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
            // Reset states when opening
            setIsBuffering(true);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Play video with sound when modal opens
    useEffect(() => {
        if (!isOpen || !videoRef.current) return;
        const v = videoRef.current;
        v.currentTime = 0;
        v.muted = false;
        v.volume = 1;

        const tryPlay = () => {
            v.muted = false;
            v.volume = 1;
            v.play().catch(() => {
                v.muted = true;
                v.play().catch(() => {});
            });
        };

        if (v.readyState >= 2) {
            tryPlay();
        } else {
            v.addEventListener('canplay', tryPlay, { once: true });
            return () => v.removeEventListener('canplay', tryPlay);
        }
    }, [isOpen, video?.id]);

    const handleCanPlay = useCallback(() => {
        setIsBuffering(false);
    }, []);

    const handleWaiting = useCallback(() => {
        setIsBuffering(true);
    }, []);

    const handlePlaying = useCallback(() => {
        setIsBuffering(false);
    }, []);

    if (!isOpen || !video || !video.video_url) return null;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('ro-RO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleDownload = () => {
        if (onDownload) {
            onDownload(video);
        } else {
            // Default download behavior
            const link = document.createElement('a');
            link.href = video.video_url!;
            link.download = `campaia-video-${video.id}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            style={{ zIndex: 9999 }}
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="relative bg-white rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button - Fixed position */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="Închide"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Video Container */}
                <div className="relative bg-black min-h-[200px]">
                    {/* Buffering Indicator */}
                    {isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                                <span className="text-white/70 text-sm font-medium">Se încarcă...</span>
                            </div>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        src={video.video_url}
                        controls
                        playsInline
                        preload="auto"
                        className="w-full max-h-[60vh] object-contain transition-opacity duration-300"
                        controlsList="nodownload"
                        onCanPlay={handleCanPlay}
                        onLoadedData={handleCanPlay}
                        onWaiting={handleWaiting}
                        onPlaying={handlePlaying}
                    />

                    {/* Video Overlay Gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Title/Prompt */}
                    <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight line-clamp-2">
                            {video.title || video.prompt}
                        </h3>
                    </div>

                    {/* Metadata Tags */}
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-full">
                            <Video className="w-4 h-4" />
                            {video.duration}s
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-full">
                            <Play className="w-4 h-4" />
                            {video.quality}
                        </span>
                        {video.tokens_spent > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                                <Sparkles className="w-4 h-4" />
                                {video.tokens_spent} credite
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 text-sm font-medium rounded-full">
                            <Clock className="w-4 h-4" />
                            {formatDate(video.created_at)}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {showActions.download && (
                            <button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-purple-500/20"
                            >
                                <Download className="w-5 h-5" />
                                Descarcă
                            </button>
                        )}

                        {showActions.share && onShare && (
                            <button
                                onClick={() => onShare(video)}
                                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all duration-200 active:scale-[0.98]"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        )}

                        {showActions.delete && onDelete && (
                            <button
                                onClick={() => onDelete(video)}
                                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all duration-200 active:scale-[0.98]"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPreviewModal;
