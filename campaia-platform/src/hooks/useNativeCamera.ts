/**
 * Campaia Platform - Native Camera Hook
 * 
 * Hook for capturing video using native camera on mobile (Capacitor)
 * or falling back to web APIs on desktop.
 */

import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Types for camera result
interface CameraVideoResult {
    blob: Blob;
    dataUrl: string;
    mimeType: string;
    size: number;
}

interface UseNativeCameraReturn {
    isCapturing: boolean;
    error: string | null;
    captureVideo: () => Promise<CameraVideoResult | null>;
    pickVideoFromGallery: () => Promise<CameraVideoResult | null>;
    isNative: boolean;
}

/**
 * Convert file to blob with data URL
 */
const fileToBlob = async (file: File): Promise<CameraVideoResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve({
                blob: file,
                dataUrl: reader.result as string,
                mimeType: file.type,
                size: file.size,
            });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};

export const useNativeCamera = (): UseNativeCameraReturn => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isNative = Capacitor.isNativePlatform();

    /**
     * Check if we're on a mobile device (for camera capture)
     */
    const isMobileDevice = useCallback(() => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }, []);

    /**
     * Capture video using camera
     */
    const captureVideo = useCallback(async (): Promise<CameraVideoResult | null> => {
        setIsCapturing(true);
        setError(null);

        try {
            return new Promise((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'video/*';
                
                // Only use capture on mobile devices (native or mobile web)
                if (isNative || isMobileDevice()) {
                    input.capture = 'environment'; // This triggers native camera on mobile
                }

                input.onchange = async (e) => {
                    setIsCapturing(false);
                    const target = e.target as HTMLInputElement;
                    const file = target.files?.[0];

                    if (!file) {
                        resolve(null);
                        return;
                    }

                    try {
                        const result = await fileToBlob(file);
                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                };

                input.oncancel = () => {
                    setIsCapturing(false);
                    resolve(null);
                };

                // Handle case where dialog doesn't open
                const handleFocus = () => {
                    window.removeEventListener('focus', handleFocus);
                    // Give a small delay to check if file was selected
                    setTimeout(() => {
                        if (!input.files?.length) {
                            setIsCapturing(false);
                        }
                    }, 500);
                };
                window.addEventListener('focus', handleFocus);

                input.click();
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to capture video';
            setError(message);
            setIsCapturing(false);
            return null;
        }
    }, [isNative, isMobileDevice]);

    /**
     * Pick video from gallery/file system
     */
    const pickVideoFromGallery = useCallback(async (): Promise<CameraVideoResult | null> => {
        setIsCapturing(true);
        setError(null);

        try {
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v';

                input.onchange = async (e) => {
                    const target = e.target as HTMLInputElement;
                    const file = target.files?.[0];

                    if (!file) {
                        resolve(null);
                        return;
                    }

                    try {
                        const result = await fileToBlob(file);
                        resolve(result);
                    } catch (err) {
                        setError('Failed to read video file');
                        resolve(null);
                    }
                };

                input.oncancel = () => resolve(null);
                input.click();
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to pick video';
            setError(message);
            return null;
        } finally {
            setIsCapturing(false);
        }
    }, []);

    return {
        isCapturing,
        error,
        captureVideo,
        pickVideoFromGallery,
        isNative,
    };
};

export default useNativeCamera;
