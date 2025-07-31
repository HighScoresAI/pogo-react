// @ts-nocheck
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    Typography,
    Button,
    Chip,
    Slider,
    TextField,
    CircularProgress,
    Alert,
    Divider,
    Tooltip,
    Paper,
} from '@mui/material';
import {
    Close,
    Fullscreen,
    FullscreenExit,
    NavigateBefore,
    NavigateNext,
    ZoomIn,
    ZoomOut,
    RotateLeft,
    PlayArrow,
    Pause,
    VolumeUp,
    VolumeOff,
    Download,
    Edit,
    ContentCopy,
    Refresh,
    Save,
    Cancel,
} from '@mui/icons-material';
import { Artifact } from '../types/artifact';
import axios from 'axios';
import DocumentEditor from './DocumentEditor';

interface ArtifactPreviewModalProps {
    open: boolean;
    onClose: () => void;
    artifact: Artifact | null;
    artifacts?: Artifact[];
    currentIndex?: number;
    onNavigate?: (index: number) => void;
    onProcess?: (artifactId: string) => Promise<void>;
    onEditText?: (artifactId: string, text: string) => Promise<void>;
    onDownload?: (artifactId: string) => Promise<void>;
    userRole?: string;
}

export default function ArtifactPreviewModal({
    open,
    onClose,
    artifact,
    artifacts = [],
    currentIndex = 0,
    onNavigate,
    onProcess,
    onEditText,
    onDownload,
    userRole = 'member',
}: ArtifactPreviewModalProps) {
    // Modal state
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Image viewer state
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Audio player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    // Text editing state
    const [isEditingText, setIsEditingText] = useState(false);
    const [editedText, setEditedText] = useState('');

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingError, setProcessingError] = useState('');
    const [taskStatus, setTaskStatus] = useState<string | null>(null);
    const [taskProgress, setTaskProgress] = useState<any>(null);
    const [taskError, setTaskError] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Refs
    const audioRef = useRef<HTMLAudioElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const isOwner = userRole === 'owner';
    const isContributor = userRole === 'contributor' || isOwner;
    const canEdit = isOwner || isContributor;

    // Document Editor state
    const [showDocumentEditor, setShowDocumentEditor] = useState(false);

    // Reset state when artifact changes
    useEffect(() => {
        if (artifact) {
            setZoom(1);
            setRotation(0);
            setImagePosition({ x: 0, y: 0 });
            setIsPlaying(false);
            setCurrentTime(0);
            setVolume(1);
            setIsMuted(false);
            setPlaybackRate(1);
            setIsEditingText(false);
            setEditedText(artifact.processedText || '');
            setProcessingError('');
            setTaskStatus(null);
            setTaskProgress(null);
            setTaskError(null);
            if (pollingRef.current) clearInterval(pollingRef.current);
        }
    }, [artifact]);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [artifact]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    if (currentIndex > 0) {
                        onNavigate?.(currentIndex - 1);
                    }
                    break;
                case 'ArrowRight':
                    if (currentIndex < artifacts.length - 1) {
                        onNavigate?.(currentIndex + 1);
                    }
                    break;
                case ' ':
                    if (artifact?.captureType === 'audio') {
                        e.preventDefault();
                        togglePlayPause();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, currentIndex, artifacts.length, artifact, onClose, onNavigate]);

    if (!artifact) return null;

    const isImage = artifact.captureType === 'image';
    const isAudio = artifact.captureType === 'audio';
    const hasProcessedText = artifact.processedText && artifact.processedText.trim() !== '';

    // Navigation handlers
    const handlePrevious = () => {
        if (currentIndex > 0) {
            onNavigate?.(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < artifacts.length - 1) {
            onNavigate?.(currentIndex + 1);
        }
    };

    // Image viewer handlers
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
    const handleResetView = () => {
        setZoom(1);
        setRotation(0);
        setImagePosition({ x: 0, y: 0 });
    };
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    const handleImageMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
        }
    };

    const handleImageMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setImagePosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleImageMouseUp = () => {
        setIsDragging(false);
    };

    // Audio player handlers
    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeChange = (value: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = value;
            setCurrentTime(value);
        }
    };

    const handleVolumeChange = (value: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = value;
            setVolume(value);
            setIsMuted(value === 0);
        }
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (audio) {
            if (isMuted) {
                audio.volume = volume;
                setIsMuted(false);
            } else {
                audio.volume = 0;
                setIsMuted(true);
            }
        }
    };

    const handlePlaybackRateChange = (rate: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    // Poll for task status
    const pollTaskStatus = async (artifactId: string) => {
        try {
            const res = await axios.get(`/artifacts/${artifactId}/task-status`);
            setTaskStatus(res.data.status);
            setTaskProgress(res.data.progress || null);
            setTaskError(res.data.status === 'FAILURE' || res.data.status === 'error' ? (res.data.result?.error || 'Processing failed') : null);
            if (res.data.status === 'SUCCESS' || res.data.status === 'FAILURE' || res.data.status === 'error') {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setIsProcessing(false);
            }
        } catch (err: any) {
            setTaskError('Failed to fetch task status');
            setIsProcessing(false);
            if (pollingRef.current) clearInterval(pollingRef.current);
        }
    };

    // Start polling after processing is triggered
    const handleProcess = async () => {
        if (!onProcess) return;
        setIsProcessing(true);
        setProcessingError('');
        setTaskStatus('PENDING');
        setTaskError(null);
        try {
            await onProcess(artifact._id);
            // Start polling every 2 seconds
            pollingRef.current = setInterval(() => pollTaskStatus(artifact._id), 2000);
        } catch (error) {
            setProcessingError(error instanceof Error ? error.message : 'Processing failed');
            setIsProcessing(false);
        }
    };

    // Clean up polling on unmount or artifact change
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [artifact]);

    // Optionally, poll status if artifact is in a processing state when opened
    useEffect(() => {
        if (artifact && artifact.status === 'processing') {
            setIsProcessing(true);
            setTaskStatus('PENDING');
            pollingRef.current = setInterval(() => pollTaskStatus(artifact._id), 2000);
        }
    }, [artifact]);

    // Action handlers
    const handleEditText = () => {
        setIsEditingText(true);
        setEditedText(artifact.processedText || '');
    };

    const handleSaveText = async () => {
        if (!onEditText) return;

        try {
            await onEditText(artifact._id, editedText);
            setIsEditingText(false);
        } catch (error) {
            console.error('Failed to save text:', error);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingText(false);
        setEditedText(artifact.processedText || '');
    };

    const handleCopyText = () => {
        if (artifact.processedText) {
            navigator.clipboard.writeText(artifact.processedText);
        }
    };

    const handleDownload = async () => {
        if (!onDownload) return;

        try {
            await onDownload(artifact._id);
        } catch (error) {
            console.error('Failed to download:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            fullWidth
            fullScreen={isFullscreen}
            PaperProps={{
                sx: {
                    maxWidth: '95vw',
                    maxHeight: '95vh',
                    width: isFullscreen ? '100vw' : '90vw',
                    height: isFullscreen ? '100vh' : '90vh',
                },
            }}
        >
            {/* Header */}
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pb: 1,
                pr: 1,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography variant="h6" noWrap>
                        {artifact.captureName}
                    </Typography>
                    <Chip
                        label={artifact.captureType}
                        size="small"
                        color={isImage ? 'primary' : 'secondary'}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Navigation arrows */}
                    {artifacts.length > 1 && (
                        <>
                            <IconButton
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                                size="small"
                            >
                                <NavigateBefore />
                            </IconButton>
                            <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center' }}>
                                {currentIndex + 1} / {artifacts.length}
                            </Typography>
                            <IconButton
                                onClick={handleNext}
                                disabled={currentIndex === artifacts.length - 1}
                                size="small"
                            >
                                <NavigateNext />
                            </IconButton>
                        </>
                    )}

                    {/* Fullscreen toggle */}
                    <IconButton onClick={() => setIsFullscreen(!isFullscreen)} size="small">
                        {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                    </IconButton>

                    {/* Close button */}
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', height: '100%' }}>
                    {/* Main Preview Area */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {/* Image Viewer */}
                        {isImage && (
                            <Box sx={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                position: 'relative',
                                bgcolor: 'grey.100',
                            }}>
                                <Box
                                    ref={imageRef}
                                    component="img"
                                    src={`/api/artifacts/${artifact.id}/file`} // Adjust path as needed
                                    alt={artifact.captureName}
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                        transition: isDragging ? 'none' : 'transform 0.2s ease',
                                        cursor: zoom > 1 ? 'grab' : 'default',
                                        '&:active': {
                                            cursor: zoom > 1 ? 'grabbing' : 'default',
                                        },
                                    }}
                                    onMouseDown={handleImageMouseDown}
                                    onMouseMove={handleImageMouseMove}
                                    onMouseUp={handleImageMouseUp}
                                    onMouseLeave={handleImageMouseUp}
                                />

                                {/* Image Controls Overlay */}
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 16,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    gap: 1,
                                    bgcolor: 'rgba(0,0,0,0.7)',
                                    borderRadius: 2,
                                    p: 1,
                                }}>
                                    <Tooltip title="Zoom Out">
                                        <IconButton onClick={handleZoomOut} size="small" sx={{ color: 'white' }}>
                                            <ZoomOut />
                                        </IconButton>
                                    </Tooltip>
                                    <Typography variant="caption" sx={{ color: 'white', alignSelf: 'center', px: 1 }}>
                                        {Math.round(zoom * 100)}%
                                    </Typography>
                                    <Tooltip title="Zoom In">
                                        <IconButton onClick={handleZoomIn} size="small" sx={{ color: 'white' }}>
                                            <ZoomIn />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Rotate">
                                        <IconButton onClick={handleRotate} size="small" sx={{ color: 'white' }}>
                                            <RotateLeft />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reset View">
                                        <IconButton onClick={handleResetView} size="small" sx={{ color: 'white' }}>
                                            <RotateLeft />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        )}

                        {/* Audio Player */}
                        {isAudio && (
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.50',
                                    borderRadius: 2,
                                    mb: 2,
                                }}>
                                    <Typography variant="h4" color="textSecondary">
                                        Audio File
                                    </Typography>
                                </Box>

                                {/* Audio Controls */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {/* Playback Controls */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                        <IconButton onClick={togglePlayPause} size="large">
                                            {isPlaying ? <Pause /> : <PlayArrow />}
                                        </IconButton>
                                    </Box>

                                    {/* Progress Bar */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="caption" sx={{ minWidth: 40 }}>
                                            {formatTime(currentTime)}
                                        </Typography>
                                        <Slider
                                            value={currentTime}
                                            max={duration}
                                            onChange={(_, value) => handleTimeChange(value as number)}
                                            sx={{ flex: 1 }}
                                        />
                                        <Typography variant="caption" sx={{ minWidth: 40 }}>
                                            {formatTime(duration)}
                                        </Typography>
                                    </Box>

                                    {/* Volume and Speed Controls */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <IconButton onClick={toggleMute} size="small">
                                            {isMuted ? <VolumeOff /> : <VolumeUp />}
                                        </IconButton>
                                        <Slider
                                            value={isMuted ? 0 : volume}
                                            max={1}
                                            step={0.1}
                                            onChange={(_, value) => handleVolumeChange(value as number)}
                                            sx={{ width: 100 }}
                                        />

                                        <Typography variant="caption" sx={{ ml: 2 }}>Speed:</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {[0.5, 1, 1.5, 2].map((rate) => (
                                                <Button
                                                    key={rate}
                                                    size="small"
                                                    variant={playbackRate === rate ? 'contained' : 'outlined'}
                                                    onClick={() => handlePlaybackRateChange(rate)}
                                                    sx={{ minWidth: 40, fontSize: '0.75rem' }}
                                                >
                                                    {rate}x
                                                </Button>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Hidden Audio Element */}
                                <audio
                                    ref={audioRef}
                                    src={`/api/artifacts/${artifact.id}/file`} // Adjust path as needed
                                    preload="metadata"
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Metadata Panel */}
                    <Box sx={{
                        width: 320,
                        borderLeft: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                            {/* Artifact Info */}
                            <Typography variant="h6" gutterBottom>
                                Artifact Details
                            </Typography>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Name
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {artifact.captureName}
                                </Typography>

                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Type
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {artifact.captureType}
                                </Typography>

                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Created
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {new Date(artifact.createdAt).toLocaleString()}
                                </Typography>

                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Created By
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {artifact.createdBy}
                                </Typography>

                                {isAudio && (
                                    <>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            Duration
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {formatTime(duration)}
                                        </Typography>
                                    </>
                                )}

                                {isImage && (
                                    <>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            Resolution
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {/* This would need to be fetched from the backend */}
                                            Unknown
                                        </Typography>
                                    </>
                                )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Processed Text */}
                            <Typography variant="h6" gutterBottom>
                                Processed Text
                            </Typography>

                            {isEditingText ? (
                                <Box sx={{ mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        variant="outlined"
                                        size="small"
                                    />
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Button size="small" onClick={handleSaveText} variant="contained">
                                            <Save sx={{ fontSize: 16, mr: 0.5 }} />
                                            Save
                                        </Button>
                                        <Button size="small" onClick={handleCancelEdit} variant="outlined">
                                            <Cancel sx={{ fontSize: 16, mr: 0.5 }} />
                                            Cancel
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ mb: 2 }}>
                                    {hasProcessedText ? (
                                        <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                                            <Typography variant="body2">
                                                {artifact.processedText}
                                            </Typography>
                                        </Paper>
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">
                                            No processed text available
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Speaker Diarization (for audio) */}
                            {isAudio && artifact.segments && artifact.segments.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Speaker Segments
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                                        {artifact.segments.map((seg, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                                                <Chip label={seg.speaker} size="small" color="primary" />
                                                <Typography variant="body2" sx={{ minWidth: 80 }}>
                                                    {formatTime(seg.start)} - {formatTime(seg.end)}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Paper>
                                </Box>
                            )}

                            {/* Processing Error */}
                            {processingError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {processingError}
                                </Alert>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {/* Process/Reprocess Button */}
                                <Button
                                    fullWidth
                                    variant={hasProcessedText ? "outlined" : "contained"}
                                    color={hasProcessedText ? "secondary" : "primary"}
                                    onClick={handleProcess}
                                    disabled={isProcessing}
                                    startIcon={isProcessing ? <CircularProgress size={16} /> : <Refresh />}
                                    sx={hasProcessedText ? { background: '#757575', color: 'white', fontWeight: 600 } : { fontWeight: 600 }}
                                >
                                    {isProcessing
                                        ? 'Processing...'
                                        : hasProcessedText
                                            ? 'REPROCESS'
                                            : 'PROCESS'}
                                </Button>

                                {/* Edit Text Button */}
                                {canEdit && hasProcessedText && !isEditingText && (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={handleEditText}
                                        startIcon={<Edit />}
                                    >
                                        Edit Text
                                    </Button>
                                )}

                                {/* Copy Text Button */}
                                {hasProcessedText && (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={handleCopyText}
                                        startIcon={<ContentCopy />}
                                    >
                                        Copy Text
                                    </Button>
                                )}

                                {/* Download Button */}
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={handleDownload}
                                    startIcon={<Download />}
                                >
                                    Download
                                </Button>

                                {/* Open in Document Editor Button */}
                                {hasProcessedText && (
                                    <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => setShowDocumentEditor(true)}>
                                        Open in Document Editor
                                    </Button>
                                )}
                            </Box>
                        </Box>
                        {/* Real-time Task Status */}
                        {isProcessing && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2">
                                    {taskStatus === 'PENDING' && 'Queued...'}
                                    {taskStatus === 'STARTED' && 'Processing...'}
                                    {taskStatus === 'SUCCESS' && 'Completed'}
                                    {taskStatus === 'FAILURE' && 'Failed'}
                                    {!taskStatus && 'Processing...'}
                                </Typography>
                                {taskProgress && taskProgress.status && (
                                    <Typography variant="caption" color="textSecondary">{taskProgress.status}</Typography>
                                )}
                            </Box>
                        )}
                        {taskError && (
                            <Alert severity="error" sx={{ mb: 2 }}>{taskError}</Alert>
                        )}
                    </Box>
                </Box>
            </DialogContent>

            {/* Document Editor Modal */}
            {showDocumentEditor && (
                <DocumentEditor
                    open={showDocumentEditor}
                    onClose={() => setShowDocumentEditor(false)}
                    initialTitle={artifact?.captureName || 'Untitled'}
                    initialContent={artifact?.processedText || ''}
                />
            )}
        </Dialog>
    );
} 