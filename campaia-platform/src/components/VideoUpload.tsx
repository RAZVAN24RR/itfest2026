/**
 * Campaia Platform - Video Upload Component
 * 
 * Allows users to upload videos from:
 * - Gallery/Photo Library
 * - File Manager/Desktop files
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FolderOpen, Loader2, CheckCircle2, X, Video, AlertCircle } from 'lucide-react';
import { uploadVideo, type VideoUploadResponse } from '../services/videoService';

interface VideoUploadProps {
    onUploadComplete?: (video: VideoUploadResponse) => void;
    onCancel?: () => void;
    campaignId?: string;
}

type UploadState = 'idle' | 'previewing' | 'uploading' | 'success' | 'error';

const VideoUpload: React.FC<VideoUploadProps> = ({
    onUploadComplete,
    onCancel,
    campaignId,
}) => {
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
    const [title, setTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Ref for file input
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleVideoSelected = useCallback((file: File | Blob) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedFile(file);
            setPreviewUrl(reader.result as string);
            setUploadState('previewing');
            setError(null);
            setIsProcessing(false);
        };
        reader.onerror = () => {
            setError('Nu am putut citi fișierul');
            setIsProcessing(false);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('[VideoUpload] File selected:', file.name, file.type, file.size);
            handleVideoSelected(file);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const handlePickFromGallery = () => {
        console.log('[VideoUpload] Gallery button clicked');
        galleryInputRef.current?.click();
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploadState('uploading');
        setUploadProgress(0);
        setError(null);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const response = await uploadVideo(selectedFile, {
                title: title || undefined,
                campaignId,
                isPublic: true,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadState('success');

            setTimeout(() => {
                onUploadComplete?.(response);
            }, 1500);

        } catch (err) {
            clearInterval(progressInterval);
            setError(err instanceof Error ? err.message : 'Upload failed');
            setUploadState('error');
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadState('idle');
        setTitle('');
        setError(null);
        onCancel?.();
    };

    const handleRetry = () => {
        setUploadState('previewing');
        setError(null);
    };

    // Render based on state

    if (uploadState === 'success') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Încărcat cu succes!</h3>
                    <p className="text-slate-500">Videoclipul tău este acum în galerie.</p>
                </div>
            </div>
        );
    }

    if (uploadState === 'previewing' || uploadState === 'uploading' || uploadState === 'error') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                    {/* Close button */}
                    <button
                        onClick={handleCancel}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10"
                        disabled={uploadState === 'uploading'}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Video Preview */}
                    <div className="relative aspect-[9/16] max-h-[50vh] bg-black">
                        {previewUrl && (
                            <video
                                src={previewUrl}
                                controls
                                playsInline
                                className="w-full h-full object-contain"
                            />
                        )}

                        {uploadState === 'uploading' && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                                <p className="text-white font-bold mb-2">Se încarcă...</p>
                                <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="text-white/60 text-sm mt-2">{uploadProgress}%</p>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-4">
                        {uploadState === 'error' && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Titlu (opțional)
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Voluntariat la asociație"
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                disabled={uploadState === 'uploading'}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 px-4 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                disabled={uploadState === 'uploading'}
                            >
                                Anulează
                            </button>
                            <button
                                onClick={uploadState === 'error' ? handleRetry : handleUpload}
                                disabled={uploadState === 'uploading'}
                                className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {uploadState === 'uploading' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : uploadState === 'error' ? (
                                    <>Reîncearcă</>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Încarcă
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Idle state - show upload options
    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-dashed border-purple-200 rounded-[2rem] p-8 hover:border-purple-400 transition-colors">
            {/* Hidden file input for gallery */}
            <input
                ref={galleryInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
            />

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                    Încarcă Videoclip
                </h3>
                <p className="text-slate-500 text-sm">
                    Alege un videoclip din galerie
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="flex justify-center max-w-md mx-auto">
                {/* Gallery Button */}
                <button
                    type="button"
                    onClick={handlePickFromGallery}
                    disabled={isProcessing}
                    className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100 transition-all group active:scale-95 disabled:opacity-50 w-full"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                        <FolderOpen className="w-7 h-7" />
                    </div>
                    <span className="font-bold text-slate-700">Alege din Galerie</span>
                    <span className="text-xs text-slate-400">
                        MP4, WebM, MOV (max 100MB)
                    </span>
                </button>
            </div>

            {isProcessing && (
                <div className="flex items-center justify-center gap-2 mt-6 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Se procesează...</span>
                </div>
            )}
        </div>
    );
};

export default VideoUpload;
