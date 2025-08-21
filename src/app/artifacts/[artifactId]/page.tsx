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
import { ApiClient, getApiBaseUrl } from '../../../lib/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    const [published, setPublished] = useState<{ type: 'audio' | 'screenshot', index: number }[]>([]);

    const [transcript, setTranscript] = useState('');
    const [session, setSession] = useState<{ projectId?: string; sessionName?: string; sessionId?: string; createdByName?: string; createdAt?: string; artifacts?: Artifact[]; status?: string; description?: string; _id?: string; vectorized_artifacts?: Array<{ artifact_id: string; status: string; vectorized_at: string }> } | null>(null);
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
        fetch(`${getApiBaseUrl()}/sessions/${sessionId}`)
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

    // After session is loaded, check which artifacts are processed and published
    useEffect(() => {
        if (session && session.artifacts) {
            refreshArtifactStatuses();
        }
    }, [session]);

    // Handle audio duration loading when selected artifact changes
    useEffect(() => {
        if (selectedArtifact && selectedArtifact.captureType === 'audio') {
            console.log('Selected audio artifact, setting up duration loading...');
            // Set up a timeout to check for duration after a short delay
            const timeoutId = setTimeout(() => {
                const audio = audioRef.current;
                if (audio && audio.duration && audio.duration > 0) {
                    console.log(`Timeout check: Audio duration = ${audio.duration}`);
                    setAudioState(prev => ({
                        ...prev,
                        duration: audio.duration
                    }));
                }
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [selectedArtifact]);

    // Helper function to get artifact status (same as session details page)
    const getArtifactStatus = (artifact: Artifact): { status: string; color: string; bgColor: string } => {
        const isProcessed = processed.some(p => p.type === artifact.captureType && p.index === (session?.artifacts?.findIndex(a => a._id === artifact._id) ?? -1));
        const isPublished = published.some(p => p.type === artifact.captureType && p.index === (session?.artifacts?.findIndex(a => a._id === artifact._id) ?? -1));

        // If we know it's published from our state, show published
        if (isPublished) {
            return {
                status: 'Published',
                color: '#2E7D32',
                bgColor: '#E8F5E8'
            };
        }
        // If it's processed but not published, show processed
        else if (isProcessed) {
            return {
                status: 'Processed',
                color: '#3CA1E8',
                bgColor: '#E6F4F9'
            };
        }
        // Otherwise show draft
        else {
            return {
                status: 'Draft',
                color: '#C97A2B',
                bgColor: '#FFF4E6'
            };
        }
    };



    // Helper function to get processed text for an artifact
    const getProcessedText = async (artifact: Artifact) => {
        if (artifact?._id) {
            try {
                const response = await fetch(`${getApiBaseUrl()}/artifacts/artifact-updates/latest/${artifact._id}`);
                const data = await response.json();
                return data.content || '';
            } catch { }
        }
        return '';
    };

    // Helper function to check if an artifact is published
    const checkArtifactPublishedStatus = async (artifact: Artifact): Promise<boolean> => {
        if (!artifact?._id) return false;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) return false;

            const response = await fetch(`${getApiBaseUrl()}/artifacts/${artifact._id}/published-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                return data.is_published || data.is_vectorized || false;
            }
        } catch (error) {
            console.warn('Failed to check published status for artifact:', artifact._id, error);
        }
        return false;
    };

    // PDF Download function for artifact
    const handleDownloadArtifactPDF = async () => {
        if (!selectedArtifact || !hasProcessedText) {
            alert('No content to download. Please process some content first.');
            return;
        }

        try {
            // Get the processed text for the selected artifact
            const processedText = await getProcessedText(selectedArtifact);

            if (!processedText || processedText.trim() === '') {
                alert('No processed content to download. Please process the artifact first.');
                return;
            }

            // Create PDF directly with jsPDF
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Set initial position
            let yPosition = 20;

            // Add header with logo-like styling
            pdf.setFillColor(60, 161, 232); // #3CA1E8
            pdf.rect(0, 0, 210, 25, 'F');

            // Add title in header
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(20);
            const title = `Artifact: ${selectedArtifact.captureType?.toUpperCase()} - ${selectedArtifact.captureName || 'Unknown'}`;
            pdf.text(title, 20, 15);

            // Reset text color for content
            pdf.setTextColor(0, 0, 0);

            // Add artifact metadata
            yPosition = 35;
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Artifact Details:', 20, yPosition);

            yPosition += 8;
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Artifact ID: ${selectedArtifact._id || 'Unknown'}`, 25, yPosition);
            yPosition += 6;
            pdf.text(`Session: ${session?.sessionName || session?.sessionId || 'Unknown'}`, 25, yPosition);
            yPosition += 6;
            pdf.text(`Type: ${selectedArtifact.captureType || 'Unknown'}`, 25, yPosition);
            yPosition += 6;
            pdf.text(`Created: ${selectedArtifact.createdAt ? new Date(selectedArtifact.createdAt).toLocaleString() : 'Unknown'}`, 25, yPosition);
            yPosition += 6;
            pdf.text(`Project: ${session?.projectId || 'Unknown'}`, 25, yPosition);

            // Add separator line
            yPosition += 10;
            pdf.setDrawColor(60, 161, 232);
            pdf.setLineWidth(1);
            pdf.line(20, yPosition, 190, yPosition);

            // Add content section header
            yPosition += 15;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.setTextColor(60, 161, 232);
            pdf.text('Processed Content', 20, yPosition);

            // Reset text color for content
            yPosition += 8;
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');

            // Process the content with better formatting
            const lines = processedText.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (!line) {
                    yPosition += 4; // Small spacing for empty lines
                    continue;
                }

                // Check if this is a heading (starts with ###)
                if (line.startsWith('###')) {
                    // New page if needed
                    if (yPosition > 250) {
                        pdf.addPage();
                        yPosition = 20;
                    }

                    // Heading styling
                    yPosition += 8;
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(14);
                    pdf.setTextColor(60, 161, 232);
                    pdf.text(line.replace('###', '').trim(), 20, yPosition);
                    yPosition += 8;
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'normal');
                } else if (line.startsWith('**') && line.endsWith('**')) {
                    // Bold text styling
                    if (yPosition > 250) {
                        pdf.addPage();
                        yPosition = 20;
                    }

                    yPosition += 6;
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(11);
                    pdf.text(line.replace(/\*\*/g, ''), 25, yPosition);
                    yPosition += 6;
                    pdf.setFont('helvetica', 'normal');
                } else {
                    // Regular text with word wrapping
                    if (yPosition > 250) {
                        pdf.addPage();
                        yPosition = 20;
                    }

                    // Word wrapping for long lines
                    const maxWidth = 170;
                    const words = line.split(' ');
                    let currentLine = '';

                    for (let j = 0; j < words.length; j++) {
                        const word = words[j];
                        const testLine = currentLine + (currentLine ? ' ' : '') + word;
                        const testWidth = pdf.getTextWidth(testLine);

                        if (testWidth > maxWidth && currentLine !== '') {
                            pdf.text(currentLine, 25, yPosition);
                            yPosition += 6;
                            currentLine = word;

                            if (yPosition > 250) {
                                pdf.addPage();
                                yPosition = 20;
                            }
                        } else {
                            currentLine = testLine;
                        }
                    }

                    if (currentLine) {
                        pdf.text(currentLine, 25, yPosition);
                        yPosition += 6;
                    }
                }
            }

            // Add footer with page numbers
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.setTextColor(128, 128, 128);
                pdf.text(`Page ${i} of ${pageCount}`, 20, 280);
                pdf.text(`Generated on: ${new Date().toLocaleString()}`, 120, 280);
            }

            // Download the PDF
            const fileName = `artifact_${selectedArtifact.captureType}_${selectedArtifact.captureName || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            // Log the download activity
            try {
                await ApiClient.logActivity({
                    activity_type: 'artifact_downloaded',
                    description: 'Artifact content downloaded as PDF',
                    session_id: sessionId as string,
                    artifact_id: selectedArtifact._id,
                    project_id: session?.projectId,
                    metadata: {
                        download_type: 'pdf',
                        content_length: processedText.length,
                        artifact_type: selectedArtifact.captureType
                    }
                });
            } catch (logError) {
                console.error('Failed to log download activity:', logError);
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    // Function to refresh artifact statuses
    const refreshArtifactStatuses = async () => {
        if (!session || !session.artifacts) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const processedArr: { type: 'audio' | 'screenshot', index: number }[] = [];
            const publishedArr: { type: 'audio' | 'screenshot', index: number }[] = [];

            await Promise.all(session.artifacts.map(async (artifact: Artifact, idx: number) => {
                if (artifact && artifact._id) {
                    try {
                        // Check if artifact has content (processed)
                        const response = await fetch(`${getApiBaseUrl()}/artifacts/artifact-updates/latest/${artifact._id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await response.json();
                        if (data.content && data.content.length > 0) {
                            processedArr.push({ type: artifact.captureType as 'audio' | 'screenshot', index: idx });

                            // Check if published
                            const isPublished = await checkArtifactPublishedStatus(artifact);
                            if (isPublished) {
                                publishedArr.push({ type: artifact.captureType as 'audio' | 'screenshot', index: idx });
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to check status for artifact:', artifact._id, error);
                    }
                }
            }));

            setProcessed(processedArr);
            setPublished(publishedArr);
            console.log('Artifact statuses refreshed:', { processed: processedArr, published: publishedArr });
        } catch (error) {
            console.error('Failed to refresh artifact statuses:', error);
        }
    };

    // Fetch project name
    useEffect(() => {
        if (session && session.projectId) {
            fetch(`${getApiBaseUrl()}/projects/${session.projectId}`)
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
            setDescribeLoading(false);
            if (inlineEditor) {
                inlineEditor.commands.setContent('');
            }

            // Check if this artifact already has processed content
            const checkExistingContent = async () => {
                try {
                    const existingText = await getProcessedText(selectedArtifact);
                    if (existingText && existingText.trim().length > 0) {
                        setTranscript(existingText);
                        setHasProcessedText(true);
                        if (inlineEditor) {
                            inlineEditor.commands.setContent(existingText);
                        }
                        console.log('Found existing processed content for artifact');
                    }
                } catch (error) {
                    console.error('Error checking existing content:', error);
                }
            };

            checkExistingContent();
        }
    }, [selectedArtifact, inlineEditor]);

    // Poll for processed text when artifact is being processed
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;
        let timeoutId: NodeJS.Timeout;

        if (selectedArtifact && isPolling) {
            // Set a timeout to stop polling after 5 minutes (300 seconds)
            timeoutId = setTimeout(() => {
                if (isPolling) {
                    console.log('Polling timeout reached, stopping...');
                    setIsPolling(false);
                    setTranscript('Processing timeout. Please try again or contact support.');
                    setHasProcessedText(false);
                }
            }, 300000); // 5 minutes

            pollInterval = setInterval(async () => {
                try {
                    const processedText = await getProcessedText(selectedArtifact);
                    if (processedText && processedText.trim().length > 0) {
                        setTranscript(processedText);
                        if (inlineEditor) {
                            inlineEditor.commands.setContent(processedText);
                        }
                        setHasProcessedText(true);
                        setIsPolling(false);
                        console.log('Artifact processing completed, transcript updated');
                    }
                } catch (error) {
                    console.error('Error during polling:', error);
                }
            }, 2000); // Check every 2 seconds
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [selectedArtifact, isPolling, inlineEditor]);

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
            await fetch(`${getApiBaseUrl()}/artifacts/${selectedArtifact._id}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: 'medium' })
            });

            // Log the artifact processing activity
            try {
                await ApiClient.logActivity({
                    activity_type: 'artifact_processed',
                    description: `Artifact "${selectedArtifact.captureType || 'Unknown'}" processed/described`,
                    session_id: sessionId as string,
                    artifact_id: selectedArtifact._id,
                    project_id: session?.projectId,
                    metadata: {
                        action: 'process',
                        artifact_type: selectedArtifact.captureType
                    }
                });
            } catch (logError) {
                console.error('Failed to log artifact processing activity:', logError);
            }

            // Set a temporary message while processing
            setTranscript('Processing artifact... Please wait.');
            console.log('Artifact processing started, polling will begin...');

            // The polling effect will automatically check for processed text
        } catch (error) {
            console.error('Error processing artifact:', error);
            setTranscript('Error processing artifact. Please try again.');
            setIsPolling(false);
            setHasProcessedText(false);
        } finally {
            setDescribeLoading(false);
        }
    };

    // Handle Re-Describe
    const handleReDescribe = () => {
        setHasProcessedText(false);
        setTranscript('');
        setIsPublished(false);

        // Log the artifact re-describe activity
        try {
            ApiClient.logActivity({
                activity_type: 'artifact_processed',
                description: 'Artifact re-described/processed',
                session_id: sessionId as string,
                artifact_id: artifactId as string,
                project_id: session?.projectId,
                metadata: {
                    action: 're_describe'
                }
            });
        } catch (logError) {
            console.error('Failed to log artifact re-describe activity:', logError);
        }
    };

    const handleSidebarClick = (id: string) => {
        // Navigate to the new artifact page, preserving sessionId in query
        router.push(`/artifacts/${id}?sessionId=${sessionId}`);
    };

    // Audio player handlers
    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (audio) {
            console.log('handlePlayPause called');
            console.log('audio.paused:', audio.paused);
            console.log('audio.src:', audio.src);
            console.log('audio.duration:', audio.duration);
            if (audio.paused) {
                // If duration is not loaded, try to load it first
                if (!audio.duration || audio.duration === Infinity || isNaN(audio.duration)) {
                    console.log('Duration not loaded, attempting to load metadata...');
                    audio.load();
                }
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
            console.log(`Time update: currentTime=${audio.currentTime}, duration=${audio.duration}`);
            setAudioState(prev => ({
                ...prev,
                currentTime: audio.currentTime,
                duration: audio.duration || prev.duration
            }));
        }
    };

    const handleSeek = (time: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = time;
        }
    };

    const handleLoadedMetadata = () => {
        const audio = audioRef.current;
        if (audio) {
            console.log(`Loaded metadata: duration=${audio.duration}`);
            setAudioState(prev => ({
                ...prev,
                duration: audio.duration,
                currentTime: audio.currentTime
            }));
        }
    };

    const loadAudioDuration = () => {
        const audio = audioRef.current;
        if (audio) {
            console.log('Manually loading audio duration');
            audio.load();
            // Force a metadata load
            audio.currentTime = 0;
        }
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handlePublishArtifact = async (options: { chatbot: boolean; blog: boolean; selectedArtifactIds?: string[] }) => {
        if (!selectedArtifact) {
            console.error('No artifact selected for publishing');
            return;
        }

        setPublishLoading(true);
        try {
            console.log('Publishing artifact:', selectedArtifact._id);

            // Get authentication token
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }

            // Call the API to publish the specific artifact
            const publishResponse = await fetch(`${getApiBaseUrl()}/artifacts/${selectedArtifact._id}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    publishToChatbot: options.chatbot,
                    publishToBlog: options.blog,
                    selectedArtifactIds: [selectedArtifact._id], // Pass the current artifact ID
                }),
            });

            if (!publishResponse.ok) {
                const errorData = await publishResponse.text();
                throw new Error(`Publish failed with status ${publishResponse.status}: ${errorData}`);
            }

            // If publishing to chatbot, also vectorize this specific artifact
            if (options.chatbot) {
                console.log('Publishing to chatbot - vectorizing artifact text...');
                try {
                    // Use the new individual artifact vectorization endpoint
                    const vectorizeResponse = await fetch(`${getApiBaseUrl()}/sessions/${sessionId}/vectorize/${artifactId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    if (!vectorizeResponse.ok) {
                        const errorData = await vectorizeResponse.text();
                        console.warn(`Vectorization failed with status ${vectorizeResponse.status}: ${errorData}`);
                    } else {
                        console.log('Artifact vectorized successfully');
                    }
                } catch (vectorizeError) {
                    console.error('Error vectorizing artifact:', vectorizeError);
                    // Don't fail the publish if vectorization fails
                }
            }

            setShowPublishModal(false);
            setIsPublished(true);
            console.log('Artifact published successfully');

            // Show success message
            alert(`Artifact published successfully! ${options.blog ? 'Blog post created.' : ''} ${options.chatbot ? 'Chatbot updated.' : ''}`);

            // Log the artifact publish activity
            try {
                let description = 'Artifact published';
                if (options.chatbot && options.blog) {
                    description = 'Artifact published to both chatbot and blog';
                } else if (options.chatbot) {
                    description = 'Artifact published to chatbot';
                } else if (options.blog) {
                    description = 'Artifact published to blog';
                }

                await ApiClient.logActivity({
                    activity_type: 'artifact_published',
                    description: description,
                    session_id: sessionId as string,
                    artifact_id: selectedArtifact._id,
                    project_id: session?.projectId,
                    metadata: {
                        publishToChatbot: options.chatbot,
                        publishToBlog: options.blog,
                        artifact_type: selectedArtifact.captureType
                    }
                });
            } catch (logError) {
                console.error('Failed to log artifact publish activity:', logError);
            }

            // Refresh the processed and published status after publishing
            if (session && session.artifacts) {
                try {
                    const processedArr: { type: 'audio' | 'screenshot', index: number }[] = [];
                    const publishedArr: { type: 'audio' | 'screenshot', index: number }[] = [];

                    await Promise.all(session.artifacts.map(async (artifact: Artifact, idx: number) => {
                        if (artifact && artifact._id) {
                            try {
                                // Check if artifact has content (processed)
                                const response = await fetch(`${getApiBaseUrl()}/artifacts/artifact-updates/latest/${artifact._id}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                const data = await response.json();
                                if (data.content && data.content.length > 0) {
                                    processedArr.push({ type: artifact.captureType as 'audio' | 'screenshot', index: idx });

                                    // Check if published using our helper function
                                    const isPublished = await checkArtifactPublishedStatus(artifact);
                                    if (isPublished) {
                                        publishedArr.push({ type: artifact.captureType as 'audio' | 'screenshot', index: idx });
                                        console.log(`Artifact ${artifact._id} is published`);
                                    }
                                }
                            } catch (contentError) {
                                console.warn('Failed to check content for artifact:', artifact._id, contentError);
                                // Don't fail the entire operation for content check failures
                            }
                        }
                    }));

                    console.log('Updated processed array:', processedArr);
                    console.log('Updated published array:', publishedArr);

                    setProcessed(processedArr);
                    setPublished(publishedArr);
                } catch (refreshError) {
                    console.warn('Failed to refresh artifact statuses after publishing:', refreshError);
                    // Don't fail the publish operation for status refresh failures
                }
            }

            // Force a refresh of the artifact statuses
            await refreshArtifactStatuses();

            // You could add a success notification here
        } catch (error) {
            console.error('Error publishing artifact:', error);

            // Provide more specific error messages
            let errorMessage = 'Unknown error occurred';
            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Network error. Please check your connection and try again.';
                } else if (error.message.includes('401') || error.message.includes('403')) {
                    errorMessage = 'Authentication error. Please log in again.';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Server error. Please try again later.';
                } else {
                    errorMessage = error.message;
                }
            }

            // Show error to user
            alert(`Failed to publish artifact: ${errorMessage}`);
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

            // Log the artifact deletion activity
            try {
                await ApiClient.logActivity({
                    activity_type: 'artifact_deleted',
                    description: `Artifact "${selectedArtifact.captureType || 'Unknown'}" was deleted`,
                    session_id: sessionId as string,
                    artifact_id: selectedArtifact._id,
                    project_id: session?.projectId,
                    metadata: {
                        artifact_type: selectedArtifact.captureType,
                        artifact_name: selectedArtifact.captureType || 'Unknown'
                    }
                });
            } catch (logError) {
                console.error('Failed to log artifact deletion activity:', logError);
            }

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
                            <Link underline="hover" color="inherit" href={session?.projectId ? `${getApiBaseUrl()}/projects/${session.projectId}` : '#'}>
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
                                    const statusInfo = getArtifactStatus(artifact);
                                    return (
                                        <ListItem key={`audio-${artifact._id}`} disablePadding sx={{ mb: 1 }}>
                                            <ListItemButton selected={artifact._id === artifactId} onClick={() => handleSidebarClick(artifact._id)} sx={{ borderRadius: 2, flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                                                    <Box sx={{ bgcolor: '#E6F4EA', borderRadius: 1.5, p: 1, mr: 1.5 }}>
                                                        <img src="/AUDIO.svg" alt="Audio" style={{ width: 20, height: 20 }} />
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{`Audio ${idx + 1}`}</Typography>
                                                </Box>
                                                <Box sx={{ ml: 4.5, px: 1.5, py: 0.3, borderRadius: 1, fontSize: 12, fontWeight: 600, bgcolor: statusInfo.bgColor, color: statusInfo.color }}>
                                                    {statusInfo.status}
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
                                    const statusInfo = getArtifactStatus(artifact);
                                    return (
                                        <ListItem key={`screenshot-${artifact._id}`} disablePadding sx={{ mb: 1 }}>
                                            <ListItemButton selected={artifact._id === artifactId} onClick={() => handleSidebarClick(artifact._id)} sx={{ borderRadius: 2, flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                                                    <Box sx={{ bgcolor: '#E6F4EA', borderRadius: 1.5, p: 1, mr: 1.5 }}>
                                                        <img src="/IMAGE.svg" alt="Image" style={{ width: 20, height: 20 }} />
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{`Image ${idx + 1}`}</Typography>
                                                </Box>
                                                <Box sx={{ ml: 4.5, px: 1.5, py: 0.3, borderRadius: 1, fontSize: 12, fontWeight: 600, bgcolor: statusInfo.bgColor, color: statusInfo.color }}>
                                                    {statusInfo.status}
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
                                                <img src={`${getApiBaseUrl()}${selectedArtifact.url.replace('/storage', '/media')}`} alt={selectedArtifact.captureName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
                                                {(() => {
                                                    const audioUrl = `${getApiBaseUrl()}${selectedArtifact.url.replace('/storage', '/media')}`;
                                                    console.log('Audio artifact URL:', audioUrl);
                                                    return null;
                                                })()}
                                                <audio
                                                    ref={audioRef}
                                                    src={`${getApiBaseUrl()}${selectedArtifact.url.replace('/storage', '/media')}`}
                                                    onTimeUpdate={handleTimeUpdate}
                                                    onPlay={() => setAudioState(prev => ({ ...prev, playing: true }))}
                                                    onPause={() => setAudioState(prev => ({ ...prev, playing: false }))}
                                                    onLoadedMetadata={handleLoadedMetadata}
                                                    onCanPlay={() => {
                                                        console.log('Audio can play');
                                                        handleLoadedMetadata();
                                                    }}
                                                    onError={(e) => console.error('Audio error:', e)}
                                                    preload="metadata"
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
                            {/* Cloud download button */}
                            <Button
                                onClick={handleDownloadArtifactPDF}
                                disabled={!hasProcessedText}
                                sx={{
                                    minWidth: 'auto',
                                    p: 1,
                                    borderRadius: '50%',
                                    bgcolor: 'transparent',
                                    '&:hover': {
                                        bgcolor: 'rgba(60, 161, 232, 0.1)',
                                    },
                                    '&:disabled': {
                                        opacity: 0.5,
                                        cursor: 'not-allowed'
                                    }
                                }}
                                title="Download PDF"
                            >
                                <img
                                    src="/cloud.svg"
                                    alt="Download PDF"
                                    style={{
                                        width: 24,
                                        height: 24,
                                        filter: !hasProcessedText ? 'grayscale(100%)' : 'none'
                                    }}
                                />
                            </Button>
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
                selectedArtifactIds={selectedArtifact ? [selectedArtifact._id] : []}
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