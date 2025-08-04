"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, Button, Card, List, ListItem, ListItemButton, IconButton, CircularProgress, Slider, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { Delete, PlayArrow, Pause, VolumeOff, VolumeUp } from '@mui/icons-material';
import { FormatBold, FormatItalic, FormatUnderlined, StrikethroughS, FormatListBulleted, FormatListNumbered, FormatQuote, FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify, Undo, Redo, AddPhotoAlternate, Link as LinkIcon, Code, FormatIndentDecrease, FormatIndentIncrease, HorizontalRule } from '@mui/icons-material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import TableExtension from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableCellExtension from '@tiptap/extension-table-cell';
import TableHeaderExtension from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import type { Artifact } from '../../../types/artifact';
import Header from '../../../components/layout/Header';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import PublishSessionModal from '../../../components/PublishSessionModal';
import ActivityLogList from '../../../components/ActivityLogList';
import { ApiClient } from '../../../lib/api';

const lowlight = createLowlight();

export default function ArtifactDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { artifactId } = params;
    // Assume sessionId is passed as a query param for now
    const sessionId = searchParams.get('sessionId');

    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processed, setProcessed] = useState<{ type: 'audio' | 'screenshot', index: number }[]>([]);

    const [transcript, setTranscript] = useState('');
    const [session, setSession] = useState<{ projectId?: string; sessionName?: string; sessionId?: string; createdByName?: string; createdAt?: string; artifacts?: Artifact[] } | null>(null);
    const [projectName, setProjectName] = useState('');
    const [audioRef] = useState<React.MutableRefObject<HTMLAudioElement | null>>(React.useRef(null));
    const [audioState, setAudioState] = useState<{ playing: boolean; muted: boolean; currentTime: number; duration: number }>({
        playing: false,
        muted: false,
        currentTime: 0,
        duration: 0,
    });
    const [describeLoading, setDescribeLoading] = useState(false);
    const [hasProcessedText, setHasProcessedText] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    // Inline editor state
    const [isEditingInline, setIsEditingInline] = useState(false);
    const [inlineEditorContent, setInlineEditorContent] = useState('');
    // Publish modal state
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Inline TipTap Editor
    const inlineEditor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            LinkExtension,
            TableExtension.configure({ resizable: true }),
            TableRowExtension,
            TableHeaderExtension,
            TableCellExtension,
            CodeBlockLowlight.configure({ lowlight }),
        ],
        content: inlineEditorContent,
        onUpdate: ({ editor }) => {
            setInlineEditorContent(editor.getHTML());
        },
    });

    // Fetch session data (same as session details page)
    useEffect(() => {
        if (!sessionId) {
            setError('No sessionId provided');
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch(`http://localhost:5000/sessions/${sessionId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched session:', data);
                setSession(data);
                setArtifacts(data.artifacts || []);
                const found = data.artifacts?.find((a: Artifact) => a._id === artifactId);
                setSelectedArtifact(found || null);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch session');
                setLoading(false);
            });
    }, [sessionId, artifactId]);

    // After session is loaded, check which artifacts are processed (same as session details page)
    useEffect(() => {
        async function checkProcessedArtifacts() {
            if (!session || !session.artifacts) return;
            const processedArr: { type: 'audio' | 'screenshot', index: number }[] = [];
            // Check all artifacts
            await Promise.all(session.artifacts.map(async (artifact: Artifact, idx: number) => {
                if (artifact && artifact._id) {
                    try {
                        const response = await fetch(`http://localhost:5000/artifacts/artifact-updates/latest/${artifact._id}`);
                        const data = await response.json();
                        if (data.content && data.content.length > 0) {
                            processedArr.push({ type: artifact.captureType as 'audio' | 'screenshot', index: idx });
                        }
                    } catch { }
                }
            }));
            setProcessed(processedArr);
        }
        checkProcessedArtifacts();
    }, [session]);

    // Helper function to get artifact status (same as session details page)
    const getArtifactStatus = (artifact: Artifact) => {
        const isProcessed = processed.some(p => p.type === artifact.captureType && p.index === artifacts.findIndex(a => a._id === artifact._id));
        return isProcessed ? 'Processed' : 'Draft';
    };

    // Helper function to get processed text for an artifact
    const getProcessedText = async (artifact: Artifact) => {
        if (artifact?._id) {
            try {
                const response = await fetch(`http://localhost:5000/artifacts/artifact-updates/latest/${artifact._id}`);
                const data = await response.json();
                return data.content || '';
            } catch { }
        }
        return '';
    };

    // Fetch project name
    useEffect(() => {
        if (session && session.projectId) {
            fetch(`http://localhost:5000/projects/${session.projectId}`)
                .then(res => res.json())
                .then(proj => setProjectName(proj.name || proj.projectName || ''))
                .catch(() => setProjectName(''));
        }
    }, [session]);

    // Reset to initial state when selected artifact changes
    useEffect(() => {
        if (selectedArtifact) {
            // Reset to initial state - show empty state until user clicks "Describe"
            setHasProcessedText(false);
            setTranscript('');
            setIsEditingInline(false);
            setIsPolling(false);
            setIsPublished(false);
            if (inlineEditor) {
                inlineEditor.commands.setContent('');
            }
        }
    }, [selectedArtifact, inlineEditor]);

    // Poll for processed text when artifact is being processed
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        if (selectedArtifact && !hasProcessedText && isPolling) {
            pollInterval = setInterval(async () => {
                const processedText = await getProcessedText(selectedArtifact);
                if (processedText) {
                    setTranscript(processedText);
                    if (inlineEditor) {
                        inlineEditor.commands.setContent(processedText);
                    }
                    setHasProcessedText(true);
                    setIsPolling(false);
                }
            }, 2000); // Check every 2 seconds
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [selectedArtifact, hasProcessedText, isPolling, inlineEditor]);

    const handleEdit = () => {
        setInlineEditorContent(transcript);
        setIsEditingInline(true);
        if (inlineEditor && transcript) {
            inlineEditor.commands.setContent(transcript);
        }
    };

    // Inline editor handlers
    const handleSaveInlineEdit = () => {
        setTranscript(inlineEditorContent);
        setIsEditingInline(false);
        // Here you could also save to backend if needed
    };

    const handleCancelInlineEdit = () => {
        setIsEditingInline(false);
        setInlineEditorContent('');
    };

    // Handle Describe button click in header
    const handleHeaderDescribe = async () => {
        if (!selectedArtifact) return;

        setDescribeLoading(true);
        setHasProcessedText(false);
        setIsPolling(true);
        setIsPublished(false);

        try {
            // First, process the artifact
            await fetch(`http://localhost:5000/artifacts/${selectedArtifact._id}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: 'medium' })
            });

            // Set a temporary message while processing
            setTranscript('Processing artifact... Please wait.');

            // The polling effect will automatically check for processed text
        } catch (error) {
            console.error('Error processing artifact:', error);
            setTranscript('Error processing artifact. Please try again.');
            setIsPolling(false);
        } finally {
            setDescribeLoading(false);
        }
    };

    // Handle Re-Describe
    const handleReDescribe = () => {
        setHasProcessedText(false);
        setTranscript('');
        setIsPublished(false);
    };

    const handleSidebarClick = (id: string) => {
        // Navigate to the new artifact page, preserving sessionId in query
        router.push(`/artifacts/${id}?sessionId=${sessionId}`);
    };

    // Audio player handlers
    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (audio) {
            if (audio.paused) {
                audio.play().catch(e => console.error('Error playing audio:', e));
                setAudioState(prev => ({ ...prev, playing: true }));
            } else {
                audio.pause();
                setAudioState(prev => ({ ...prev, playing: false }));
            }
        }
    };

    const handleMute = () => {
        const audio = audioRef.current;
        if (audio) {
            const newState = !audio.muted;
            audio.muted = newState;
            setAudioState(prev => ({ ...prev, muted: newState }));
        }
    };

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (audio) {
            setAudioState(prev => ({ ...prev, currentTime: audio.currentTime, duration: audio.duration }));
        }
    };

    const handleSeek = (time: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = time;
        }
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handlePublishArtifact = async (options: { chatbot: boolean; blog: boolean }) => {
        if (!selectedArtifact) {
            console.error('No artifact selected for publishing');
            return;
        }

        setPublishLoading(true);
        try {
            console.log('Publishing artifact:', selectedArtifact._id);

            // Call the API to publish the specific artifact
            await fetch(`http://localhost:5000/artifacts/${selectedArtifact._id}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publishToChatbot: options.chatbot,
                    publishToBlog: options.blog,
                }),
            });

            // If publishing to chatbot, also vectorize this specific artifact
            if (options.chatbot) {
                console.log('Publishing to chatbot - vectorizing artifact text...');
                try {
                    // For individual artifact vectorization, we'll use the session vectorize endpoint
                    // which will include this artifact's processed text
                    await fetch(`http://localhost:5000/sessions/${sessionId}/vectorize`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    console.log('Artifact text vectorized successfully');
                } catch (vectorizeError) {
                    console.error('Error vectorizing artifact text:', vectorizeError);
                    // Don't fail the publish if vectorization fails
                }
            }

            setShowPublishModal(false);
            setIsPublished(true);
            console.log('Artifact published successfully');
            // You could add a success notification here
        } catch (error) {
            console.error('Error publishing artifact:', error);
            // You could add an error notification here
        } finally {
            setPublishLoading(false);
        }
    };

    const handleDeleteArtifact = async () => {
        console.log('Delete button clicked, selectedArtifact:', selectedArtifact);
        if (!selectedArtifact) {
            console.log('No selectedArtifact, returning');
            return;
        }
        setDeleteLoading(true);
        try {
            console.log('Making delete request for artifact:', selectedArtifact._id);
            await ApiClient.delete(`/artifacts/${selectedArtifact._id}`);
            // Update the artifacts list in the session
            setSession((prev: { projectId?: string; sessionName?: string; sessionId?: string; createdByName?: string; createdAt?: string; artifacts?: Artifact[] } | null) => {
                if (prev && prev.artifacts) {
                    const updatedArtifacts = prev.artifacts.filter((a: Artifact) => a._id !== selectedArtifact._id);
                    return { ...prev, artifacts: updatedArtifacts };
                }
                return prev;
            });
            setArtifacts((prev: Artifact[]) => prev.filter((a: Artifact) => a._id !== selectedArtifact._id));
            setSelectedArtifact(null);
            setTranscript('');
            setIsEditingInline(false);
            setHasProcessedText(false);
            setIsPolling(false);
            if (inlineEditor) {
                inlineEditor.commands.setContent('');
            }
            setDeleteDialogOpen(false);
            router.push(`/sessions/${sessionId}`); // Redirect to session details
        } catch (error) {
            console.error('Error deleting artifact:', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    name: error.name
                });
            }
            alert('Failed to delete artifact. Please try again.');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <Box sx={{ bgcolor: '#fff', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
                <Header />
                {/* Purple Banner */}
                <Box sx={{ width: '100%', height: 160, background: 'url(/purple-bg.png) center/cover no-repeat', mb: { xs: 2, md: 4 } }} />
                {/* Session Header Section */}
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: 1114, mx: 'auto', pt: 4 }}>
                        {/* Breadcrumb */}
                        <Breadcrumbs sx={{ mb: 1 }} aria-label="breadcrumb">
                            <Link underline="hover" color="inherit" href="/dashboard">Dashboard</Link>
                            <Link underline="hover" color="inherit" href={session?.projectId ? `/projects/${session.projectId}` : '#'}>
                                Project {projectName || ''}
                            </Link>
                            <Typography color="text.primary" fontWeight={700}>Session {session?.sessionName || session?.sessionId || ''}</Typography>
                        </Breadcrumbs>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                            <Box>
                                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                                    {session?.sessionName || session?.sessionId || 'Session'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Created: {session?.createdByName || 'Unknown'}{session?.createdAt ? `, ${new Date(session.createdAt).toLocaleString()}` : ''}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    sx={{
                                        bgcolor: '#00AAF8',
                                        color: '#fff',
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 3,
                                        py: 1.5,
                                        fontSize: 16,
                                        boxShadow: 'none',
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: '#0095d5' },
                                        height: 44,
                                        minWidth: 180,
                                    }}
                                    onClick={handleHeaderDescribe}
                                    disabled={describeLoading}
                                >
                                    {describeLoading ? 'Processing...' : 'Transcribe / Describe'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh' }}>
                    {/* Sidebar */}
                    <Box sx={{ width: 260, minWidth: 200, p: 2, mr: 4 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Artifacts</Typography>
                        {/* Audio Section */}
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1, mb: 1, color: '#222' }}>Audio</Typography>
                        {!artifacts || artifacts.filter((a: Artifact) => a.captureType === 'audio').length === 0 ? (
                            <Typography sx={{ color: '#888', fontSize: 14, mb: 1 }}>No audio</Typography>
                        ) : (
                            <List sx={{ mb: 2 }}>
                                {artifacts.filter((a: Artifact) => a.captureType === 'audio').map((artifact: Artifact, idx: number) => {
                                    const status = getArtifactStatus(artifact);
                                    return (
                                        <ListItem key={`audio-${artifact._id}`} disablePadding sx={{ mb: 1 }}>
                                            <ListItemButton selected={artifact._id === artifactId} onClick={() => handleSidebarClick(artifact._id)} sx={{ borderRadius: 2, flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                                                    <Box sx={{ bgcolor: '#E6F4EA', borderRadius: 1.5, p: 1, mr: 1.5 }}>
                                                        <img src="/AUDIO.svg" alt="Audio" style={{ width: 20, height: 20 }} />
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{`Audio ${idx + 1}`}</Typography>
                                                </Box>
                                                <Box sx={{ ml: 4.5, px: 1.5, py: 0.3, borderRadius: 1, fontSize: 12, fontWeight: 600, bgcolor: status === 'Processed' ? '#E6F4F9' : '#FFF4E6', color: status === 'Processed' ? '#3CA1E8' : '#C97A2B' }}>
                                                    {status}
                                                </Box>
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                        {/* Images Section */}
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1, color: '#222' }}>Images</Typography>
                        {!artifacts || artifacts.filter((a: Artifact) => a.captureType === 'screenshot').length === 0 ? (
                            <Typography sx={{ color: '#888', fontSize: 14, mb: 1 }}>No images</Typography>
                        ) : (
                            <List>
                                {artifacts.filter((a: Artifact) => a.captureType === 'screenshot').map((artifact: Artifact, idx: number) => {
                                    const status = getArtifactStatus(artifact);
                                    return (
                                        <ListItem key={`screenshot-${artifact._id}`} disablePadding sx={{ mb: 1 }}>
                                            <ListItemButton selected={artifact._id === artifactId} onClick={() => handleSidebarClick(artifact._id)} sx={{ borderRadius: 2, flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                                                    <Box sx={{ bgcolor: '#E6F4EA', borderRadius: 1.5, p: 1, mr: 1.5 }}>
                                                        <img src="/IMAGE.svg" alt="Image" style={{ width: 20, height: 20 }} />
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{`Image ${idx + 1}`}</Typography>
                                                </Box>
                                                <Box sx={{ ml: 4.5, px: 1.5, py: 0.3, borderRadius: 1, fontSize: 12, fontWeight: 600, bgcolor: status === 'Processed' ? '#E6F4F9' : '#FFF4E6', color: status === 'Processed' ? '#3CA1E8' : '#C97A2B' }}>
                                                    {status}
                                                </Box>
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </Box>
                    {/* Main Content */}
                    <Box sx={{ flex: 1, maxWidth: 900 }}>
                        {/* Artifact Title */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5" fontWeight={600}>
                                {selectedArtifact ? (
                                    selectedArtifact.captureType === 'screenshot' || selectedArtifact.captureType === 'image' ?
                                        `Image ${String(artifacts.filter(a => a.captureType === 'screenshot').findIndex(a => a._id === selectedArtifact._id) + 1)}` :
                                        selectedArtifact.captureType === 'audio' ?
                                            `Audio ${String(artifacts.filter(a => a.captureType === 'audio').findIndex(a => a._id === selectedArtifact._id) + 1)}` :
                                            selectedArtifact._id
                                ) : 'Artifact'}
                            </Typography>
                            {selectedArtifact && (
                                <IconButton size="small" sx={{ color: '#E53935' }} onClick={() => setDeleteDialogOpen(true)}>
                                    <Delete />
                                </IconButton>
                            )}
                        </Box>
                        {/* Artifact Content Card */}
                        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 1, minHeight: 180, overflow: 'hidden' }}>
                            {loading ? (
                                <CircularProgress size={32} />
                            ) : error ? (
                                <Typography color="error">{error}</Typography>
                            ) : selectedArtifact ? (
                                <>
                                    {/* Render artifact content */}
                                    {selectedArtifact.captureType === 'screenshot' || selectedArtifact.captureType === 'image' ? (
                                        selectedArtifact.url ? (
                                            <Box sx={{ width: '100%', height: '100%' }}>
                                                <img src={`http://localhost:5000${selectedArtifact.url.replace('/storage', '/media')}`} alt={selectedArtifact.captureName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">No image available.</Typography>
                                        )
                                    ) : selectedArtifact.captureType === 'audio' ? (
                                        selectedArtifact.url ? (
                                            <Box sx={{
                                                width: '100%',
                                                height: 200,
                                                background: 'linear-gradient(135deg, #0a4a72 0%, #000 100%)',
                                                borderRadius: 3,
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                p: 3
                                            }}>
                                                {/* Hidden audio element */}
                                                <audio
                                                    ref={audioRef}
                                                    src={`http://localhost:5000${selectedArtifact.url.replace('/storage', '/media')}`}
                                                    onTimeUpdate={handleTimeUpdate}
                                                    onPlay={() => setAudioState(prev => ({ ...prev, playing: true }))}
                                                    onPause={() => setAudioState(prev => ({ ...prev, playing: false }))}
                                                    onLoadedMetadata={handleTimeUpdate}
                                                    style={{ display: 'none' }}
                                                />

                                                {/* Waveform Visualization */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    flex: 1,
                                                    gap: 0.5
                                                }}>
                                                    {Array.from({ length: 50 }, (_, i) => (
                                                        <Box
                                                            key={i}
                                                            sx={{
                                                                width: 3,
                                                                height: Math.random() * 40 + 10,
                                                                bgcolor: 'rgba(255, 255, 255, 0.3)',
                                                                borderRadius: 1,
                                                                transition: 'height 0.1s ease'
                                                            }}
                                                        />
                                                    ))}
                                                </Box>

                                                {/* Playback Controls */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    color: '#fff'
                                                }}>
                                                    {/* Play/Pause Button */}
                                                    <IconButton
                                                        onClick={handlePlayPause}
                                                        sx={{
                                                            color: '#fff',
                                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                                        }}
                                                    >
                                                        {audioState.playing ? <Pause /> : <PlayArrow />}
                                                    </IconButton>

                                                    {/* Volume Button */}
                                                    <IconButton
                                                        onClick={handleMute}
                                                        sx={{
                                                            color: '#fff',
                                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                                        }}
                                                    >
                                                        {audioState.muted ? <VolumeOff /> : <VolumeUp />}
                                                    </IconButton>

                                                    {/* Current Time */}
                                                    <Typography sx={{ color: '#fff', fontSize: 14, minWidth: 40 }}>
                                                        {formatTime(audioState.currentTime)}
                                                    </Typography>

                                                    {/* Progress Bar */}
                                                    <Box sx={{ flex: 1, mx: 2 }}>
                                                        <Slider
                                                            value={audioState.currentTime}
                                                            max={audioState.duration || 1}
                                                            onChange={(_, value) => handleSeek(value as number)}
                                                            sx={{
                                                                color: '#00AAF8',
                                                                '& .MuiSlider-thumb': {
                                                                    bgcolor: '#00AAF8',
                                                                    width: 12,
                                                                    height: 12,
                                                                },
                                                                '& .MuiSlider-track': {
                                                                    bgcolor: '#00AAF8',
                                                                },
                                                                '& .MuiSlider-rail': {
                                                                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                                                                }
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Total Duration */}
                                                    <Typography sx={{ color: '#fff', fontSize: 14, minWidth: 40 }}>
                                                        {formatTime(audioState.duration)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">No audio available.</Typography>
                                        )
                                    ) : (
                                        <Typography sx={{ color: '#888' }}>Content: {selectedArtifact.processedText || 'No content available'}</Typography>
                                    )}
                                </>
                            ) : (
                                <Typography color="text.secondary">Artifact not found.</Typography>
                            )}
                        </Card>
                        {/* Transcription / Description Section */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pl: 2 }}>
                            <Typography variant="h6" fontWeight={600}>Transcription / Description</Typography>
                            {/* Cloud icon */}
                            <img src="/cloud.svg" alt="Cloud Icon" style={{ width: 24, height: 24, marginRight: 16 }} />
                        </Box>
                        <Box sx={{ mb: 4, borderRadius: 3, boxShadow: 1, overflow: 'hidden', bgcolor: '#fff' }}>
                            {!hasProcessedText ? (
                                // Initial state: illustration, message, Describe button
                                <Box sx={{ px: 0, py: 4, width: '100%', mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ mb: 3, mt: 1 }}>
                                        <img src="/oneee.png" alt="Transcription Illustration" style={{ width: 300, height: 160, objectFit: 'contain' }} />
                                    </Box>
                                    <Typography sx={{ mb: 3, color: '#222', textAlign: 'center', fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%' }}>
                                        Transcribe or Describe your artifact - edit or refine it before publishing.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            bgcolor: '#00AAF8',
                                            color: '#fff',
                                            fontWeight: 600,
                                            fontSize: 16,
                                            borderRadius: 2,
                                            px: 4,
                                            py: 1.5,
                                            minWidth: 140,
                                            height: 48,
                                            boxShadow: 'none',
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: '#0095d5' },
                                        }}
                                        onClick={handleHeaderDescribe}
                                        disabled={describeLoading}
                                    >
                                        {describeLoading ? 'Processing...' : 'Describe'}
                                    </Button>
                                </Box>
                            ) : (
                                // After Describe: show processed text or inline editor
                                <>
                                    {isEditingInline ? (
                                        <>
                                            {/* Inline Editor with Toolbar */}
                                            <Box sx={{
                                                width: '100%',
                                                borderRadius: '12px',
                                                border: '1px solid #D4DBE3',
                                                background: '#fff',
                                                overflow: 'hidden'
                                            }}>
                                                {/* Toolbar */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 2,
                                                    borderBottom: '1px solid #E0E0E0',
                                                    bgcolor: '#fff',
                                                    flexWrap: 'nowrap',
                                                    overflowX: 'auto',
                                                    color: '#222',
                                                    fontWeight: 700
                                                }}>
                                                    {/* Undo/Redo */}
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().undo().run()}>
                                                        <Undo />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().redo().run()}>
                                                        <Redo />
                                                    </IconButton>
                                                    <Box sx={{ width: 1, height: 20, bgcolor: '#E0E0E0', mx: 1 }} />

                                                    {/* Basic Formatting */}
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().toggleBold().run()}>
                                                        <FormatBold />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().toggleItalic().run()}>
                                                        <FormatItalic />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().toggleUnderline().run()}>
                                                        <FormatUnderlined />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().toggleStrike().run()}>
                                                        <StrikethroughS />
                                                    </IconButton>
                                                    <Box sx={{ width: 1, height: 20, bgcolor: '#E0E0E0', mx: 1 }} />

                                                    {/* Lists */}
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().toggleBulletList().run()}>
                                                        <FormatListBulleted />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().toggleOrderedList().run()}>
                                                        <FormatListNumbered />
                                                    </IconButton>
                                                    <Box sx={{ width: 1, height: 20, bgcolor: '#E0E0E0', mx: 1 }} />

                                                    {/* Alignment */}
                                                    <IconButton size="small" color="inherit">
                                                        <FormatAlignLeft />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit">
                                                        <FormatAlignCenter />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit">
                                                        <FormatAlignRight />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit">
                                                        <FormatAlignJustify />
                                                    </IconButton>
                                                    <Box sx={{ width: 1, height: 20, bgcolor: '#E0E0E0', mx: 1 }} />

                                                    {/* Indentation */}
                                                    <IconButton size="small" color="inherit">
                                                        <FormatIndentDecrease />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit">
                                                        <FormatIndentIncrease />
                                                    </IconButton>
                                                    <Box sx={{ width: 1, height: 20, bgcolor: '#E0E0E0', mx: 1 }} />

                                                    {/* Links/Media/Code */}
                                                    <IconButton size="small" color="inherit">
                                                        <LinkIcon />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit">
                                                        <AddPhotoAlternate />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().toggleCodeBlock().run()}>
                                                        <Code />
                                                    </IconButton>
                                                    <Box sx={{ width: 1, height: 20, bgcolor: '#E0E0E0', mx: 1 }} />

                                                    {/* Quotes/Horizontal Rule */}
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().toggleBlockquote().run()}>
                                                        <FormatQuote />
                                                    </IconButton>
                                                    <IconButton size="small" color="inherit" onClick={() => inlineEditor?.chain().focus().setHorizontalRule().run()}>
                                                        <HorizontalRule />
                                                    </IconButton>
                                                </Box>
                                                {/* Editor Content */}
                                                <Box sx={{ p: 3, minHeight: 220 }}>
                                                    <EditorContent editor={inlineEditor} />
                                                </Box>
                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            {/* Text box containing only the text */}
                                            <Box sx={{
                                                px: 3,
                                                py: 3,
                                                mx: 'auto',
                                                minHeight: 80,
                                                maxHeight: 220,
                                                overflowY: 'auto',
                                                overflowX: 'hidden'
                                            }}>
                                                <div
                                                    dangerouslySetInnerHTML={{ __html: transcript || '<span style=\'color:#888\'>No transcript available.</span>' }}
                                                    style={{
                                                        lineHeight: '1.5',
                                                        fontSize: '15px',
                                                        color: '#222'
                                                    }}
                                                />
                                            </Box>
                                        </>
                                    )}
                                </>
                            )}
                        </Box>
                        {/* Buttons positioned outside the box */}
                        {hasProcessedText && !isEditingInline && (
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2, pr: 1 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleEdit}
                                    sx={{
                                        borderColor: '#3CA1E8',
                                        color: '#3CA1E8',
                                        fontWeight: 600,
                                        '&:hover': {
                                            borderColor: '#0095d5',
                                            backgroundColor: 'rgba(60, 161, 232, 0.04)'
                                        }
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => setShowPublishModal(true)}
                                    sx={{ bgcolor: '#4CAF50', fontWeight: 600, '&:hover': { bgcolor: '#45a049' } }}
                                >
                                    {isPublished ? 'Re-publish Artifact' : 'Publish Artifact'}
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleReDescribe}
                                    sx={{ bgcolor: '#3CA1E8', fontWeight: 600, '&:hover': { bgcolor: '#0095d5' } }}
                                >
                                    Re-Describe
                                </Button>
                            </Box>
                        )}
                        {/* Cancel and Save buttons for inline editor - positioned outside the editor div */}
                        {hasProcessedText && isEditingInline && (
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2, pr: 1 }}>
                                <Button
                                    variant="outlined"
                                    sx={{
                                        borderColor: '#3CA1E8',
                                        color: '#3CA1E8',
                                        fontWeight: 600,
                                        '&:hover': {
                                            borderColor: '#0095d5',
                                            backgroundColor: 'rgba(60, 161, 232, 0.04)'
                                        }
                                    }}
                                    onClick={handleCancelInlineEdit}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    sx={{
                                        bgcolor: '#3CA1E8',
                                        fontWeight: 600,
                                        '&:hover': { bgcolor: '#0095d5' }
                                    }}
                                    onClick={handleSaveInlineEdit}
                                >
                                    Save
                                </Button>
                            </Box>
                        )}
                        {/* Log History Section */}
                        <Box sx={{ mt: 4, mb: 8 }}>
                            <ActivityLogList
                                type="artifact"
                                id={selectedArtifact?._id || ''}
                                title="Log history"
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Publish Artifact Modal */}
            <PublishSessionModal
                open={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onPublish={handlePublishArtifact}
                loading={publishLoading}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete this artifact? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteArtifact} color="error" variant="contained" disabled={deleteLoading}>
                        {deleteLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

        </>
    );
} 