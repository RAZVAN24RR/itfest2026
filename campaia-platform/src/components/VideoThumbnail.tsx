/**
 * Campaia Platform - Video Thumbnail Component
 * 
 * Displays a static thumbnail extracted from video's first frame.
 * Does NOT load the full video - only extracts one frame for preview.
 * The actual video loads only when user opens the modal.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Play, Loader2, Video as VideoIcon } from 'lucide-react';

interface VideoThumbnailProps {
    src: string;
    thumbnailUrl?: string | null;  // Pre-generated thumbnail from server
    className?: string;
    aspectRatio?: string;
    onClick?: () => void;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
    src,
    thumbnailUrl: serverThumbnail,
    className = '',
    aspectRatio = 'aspect-[9/16]',
    onClick,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [extractedThumbnail, setExtractedThumbnail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const extractedRef = useRef(false);
    
    // Use server thumbnail if available, otherwise use extracted
    const thumbnailUrl = serverThumbnail || extractedThumbnail;

    // Intersection Observer - only extract thumbnail when visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !extractedRef.current) {
                        setIsVisible(true);
                    }
                });
            },
            {
                rootMargin: '200px', // Start loading before visible
                threshold: 0,
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    // Extract thumbnail when visible (only if no server thumbnail)
    useEffect(() => {
        // Skip extraction if we have a server-provided thumbnail
        if (serverThumbnail) return;
        if (!isVisible || extractedRef.current || !src) return;

        extractedRef.current = true;
        setIsLoading(true);

        // Create a temporary video element (NOT in DOM)
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.preload = 'metadata';
        
        // Only load enough to get first frame
        video.src = src;

        const handleLoadedData = () => {
            try {
                // Seek to 0.5 seconds for a better frame (not black)
                video.currentTime = 0.5;
            } catch {
                // If seeking fails, use current frame
                extractFrame();
            }
        };

        const handleSeeked = () => {
            extractFrame();
        };

        const extractFrame = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 360;
                canvas.height = video.videoHeight || 640;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setExtractedThumbnail(dataUrl);
                }
            } catch (e) {
                console.warn('Could not extract video thumbnail:', e);
                setHasError(true);
            } finally {
                setIsLoading(false);
                // Clean up video element to free memory
                video.src = '';
                video.load();
            }
        };

        const handleError = () => {
            setHasError(true);
            setIsLoading(false);
            video.src = '';
            video.load();
        };

        // Set timeout for slow videos
        const timeout = setTimeout(() => {
            if (!extractedThumbnail) {
                setHasError(true);
                setIsLoading(false);
                video.src = '';
                video.load();
            }
        }, 8000);

        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('error', handleError);

        // Start loading
        video.load();

        return () => {
            clearTimeout(timeout);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('error', handleError);
            video.src = '';
        };
    }, [isVisible, src, thumbnailUrl]);

    return (
        <div
            ref={containerRef}
            className={`relative bg-slate-100 overflow-hidden cursor-pointer group ${aspectRatio} ${className}`}
            onClick={onClick}
        >
            {/* Thumbnail Image */}
            {thumbnailUrl && (
                <img
                    src={thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            )}

            {/* Loading State */}
            {isLoading && !thumbnailUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
            )}

            {/* Error/Fallback State */}
            {(hasError || (!isLoading && !thumbnailUrl && isVisible)) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                    <VideoIcon className="w-8 h-8 text-purple-400" />
                </div>
            )}

            {/* Placeholder before visible */}
            {!isVisible && !thumbnailUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <VideoIcon className="w-6 h-6 text-slate-300" />
                </div>
            )}

            {/* Play Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100 shadow-lg">
                    <Play className="w-5 h-5 text-slate-800 ml-0.5" fill="currentColor" />
                </div>
            </div>

            {/* Hidden canvas for extraction */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default VideoThumbnail;

