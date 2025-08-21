"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Button, Card } from '@mui/material';
import Grid from '@mui/material/Grid';
import { CalendarToday, Folder, FormatBold, FormatItalic, FormatUnderlined, StrikethroughS, FormatListBulleted, FormatListNumbered, FormatQuote, FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify, Undo, Redo, AddPhotoAlternate, Link as LinkIcon, Code, FormatIndentDecrease, FormatIndentIncrease, HorizontalRule, FormatClear } from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DocumentEditor from '../../../components/DocumentEditor';
import PublishSessionModal from '../../../components/PublishSessionModal';
import ActivityLogList from '../../../components/ActivityLogList';
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
import { ApiClient, getApiBaseUrl } from '@/lib/api';
import type { Artifact } from '../../../types/artifact';
import IconButton from '@mui/material/IconButton';
import { testValue } from '@/lib/test';
import Header from '../../../components/layout/Header';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

console.log('testValue from lib/test:', testValue);

const lowlight = createLowlight();

// Custom styles for TipTap editor
const editorStyles = `
  .ProseMirror {
    outline: none;
    font-size: 15px;
    line-height: 1.6;
    color: #222;
    font-family: inherit;
  }
  
  .ProseMirror p {
    margin: 0 0 1em 0;
  }
  
  .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 {
    margin: 1em 0 0.5em 0;
    font-weight: 600;
  }
  
  .ProseMirror ul, .ProseMirror ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }
  
  .ProseMirror blockquote {
    border-left: 3px solid #ddd;
    margin: 1em 0;
    padding-left: 1em;
    color: #666;
  }
  
  .ProseMirror code {
    background-color: #f5f5f5;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
  }
  
  .ProseMirror pre {
    background-color: #f5f5f5;
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  .ProseMirror table {
    border-collapse: collapse;
    margin: 1em 0;
    width: 100%;
  }
  
  .ProseMirror th, .ProseMirror td {
    border: 1px solid #ddd;
    padding: 0.5em;
    text-align: left;
  }
  
  .ProseMirror th {
    background-color: #f5f5f5;
    font-weight: 600;
  }
`;



function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'success';
        case 'in progress':
            return 'warning';
        case 'pending':
            return 'info';
        default:
            return 'default';
    }
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface Session {
    _id: string;
    description: string;
    status: string;
    duration?: string;
    artifacts: Artifact[];
    createdAt: string;
    // Additional properties used in the code
    sessionId?: string;
    sessionName?: string;
    projectId?: string;
    audioFiles?: string[];
    screenshots?: string[];
    audioArtifacts?: Artifact[];
    screenshotArtifacts?: Artifact[];
    createdByName?: string;
    error?: string;
    vectorized_artifacts?: Array<{ artifact_id: string; status: string; vectorized_at: string }>;
}

// Utility to strip HTML tags
function stripHtml(html: string) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

export default function SessionDetailPage() {
    // All hooks at the top, only called once, in the same order every render
    const params = useParams();
    const router = useRouter();
    const { sessionId } = params;
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
    const [selectedArtifactIndex, setSelectedArtifactIndex] = useState<number | null>(null);
    const [showDocumentEditor, setShowDocumentEditor] = useState(false);
    const [documentEditorContent, setDocumentEditorContent] = useState('');
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);
    const [audioRefs] = useState<React.MutableRefObject<(HTMLAudioElement | null)[]>>(React.useRef([]));
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'audio' | 'screenshot', index: number } | null>(null);
    const [processing, setProcessing] = useState<{ type: 'audio' | 'screenshot', index: number } | null>(null);
    const [processed, setProcessed] = useState<{ type: 'audio' | 'screenshot', index: number }[]>([]);
    const [published, setPublished] = useState<{ type: 'audio' | 'screenshot', index: number }[]>([]);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewText, setViewText] = useState<string>('');
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editorInitialContent, setEditorInitialContent] = useState('');
    const [editorArtifactId, setEditorArtifactId] = useState<string | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editDisabled, setEditDisabled] = useState(true);
    const [editorContent, setEditorContent] = useState('');
    const [vectorizeLoading, setVectorizeLoading] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [pendingSaveContent, setPendingSaveContent] = useState('');
    const [projectName, setProjectName] = useState('');
    // Custom audio player state (only once)
    const [audioStates, setAudioStates] = useState<{ playing: boolean; muted: boolean; currentTime: number; duration: number }[]>([]);
    // Selection mode for images
    const [selectMode, setSelectMode] = useState(false);
    const [selectedImages, setSelectedImages] = useState<number[]>([]);
    const [selectedAudioArtifacts, setSelectedAudioArtifacts] = useState<string[]>([]);
    // Confirmation dialog for deleting images
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    // Add state for transcript and loading
    const [transcript, setTranscript] = useState('');
    const [hasTranscript, setHasTranscript] = useState(false);
    const [describeLoading, setDescribeLoading] = useState(false);
    // Inline editor state
    const [isEditingInline, setIsEditingInline] = useState(false);
    const [inlineEditorContent, setInlineEditorContent] = useState('');
    // Publish modal state
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

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

    // Update editor content when inlineEditorContent changes
    // Remove this useEffect:
    // useEffect(() => {
    //     if (inlineEditor && inlineEditorContent) {
    //         inlineEditor.commands.setContent(inlineEditorContent);
    //     }
    // }, [inlineEditorContent, inlineEditor]);

    const handleSelectImage = (idx: number) => {
        if (!selectMode) return;
        setSelectedImages(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    // Initialize audioStates when session.audioFiles changes
    useEffect(() => {
        if (session && session.audioFiles) {
            console.log('Initializing audio states for', session.audioFiles.length, 'audio files');
            setAudioStates(
                session.audioFiles.map(() => ({
                    playing: false,
                    muted: false,
                    currentTime: 0,
                    duration: 0,
                }))
            );
            // Initialize audio refs array
            audioRefs.current = new Array(session.audioFiles.length).fill(null);

            // Set up a timeout to check for duration after a short delay
            const timeoutId = setTimeout(() => {
                audioRefs.current.forEach((audio, index) => {
                    if (audio && audio.duration && audio.duration > 0) {
                        console.log(`Timeout check: Audio ${index} duration = ${audio.duration}`);
                        setAudioStates(prev => prev.map((s, i) => i === index ? {
                            ...s,
                            duration: audio.duration
                        } : s));
                    }
                });
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [session?.audioFiles]);

    // Always fetch latest processed text when modal is opened
    useEffect(() => {
        const fetchLatestProcessedText = async () => {
            if (showDocumentEditor && editorArtifactId) {
                setViewLoading(true);
                setViewError('');
                try {
                    const response = await fetch(`${getApiBaseUrl()}/artifacts/artifact-updates/latest/${editorArtifactId}`);
                    const data = await response.json();
                    setViewText(data.content || '');
                } catch (err) {
                    setViewError('Failed to fetch processed text.');
                }
                setViewLoading(false);
            }
        };
        fetchLatestProcessedText();

    }, [showDocumentEditor, editorArtifactId]);

    useEffect(() => {
        async function fetchSession() {
            setLoading(true);
            try {
                const data = await ApiClient.get(`/sessions/${sessionId}`) as Session;
                console.log('Fetched session:', data);
                setSession(data);
            } catch (err) {
                console.error('Error fetching session:', err);
                setSession(null);
            } finally {
                setLoading(false);
            }
        }
        if (sessionId) fetchSession();
    }, [sessionId]);

    // Fetch project name
    useEffect(() => {
        const fetchProjectName = async () => {
            if (session?.projectId) {
                try {
                    const response = await ApiClient.get(`/projects/${session.projectId}`) as any;
                    if (response.name) {
                        setProjectName(response.name);
                    }
                } catch (error) {
                    console.error('Failed to fetch project name:', error);
                }
            }
        };

        fetchProjectName();
    }, [session?.projectId]);

    // Initialize audio artifacts as always selected
    useEffect(() => {
        if (session?.artifacts) {
            const audioArtifacts = session.artifacts
                .filter((artifact: any) => artifact.captureType === 'audio')
                .map((artifact: any) => artifact._id);
            setSelectedAudioArtifacts(audioArtifacts);
        }
    }, [session?.artifacts]);

    // After session is loaded, check which artifacts are processed and published
    useEffect(() => {
        async function checkProcessedArtifacts() {
            if (!session || !session.artifacts) return;
            const processedArr: { type: 'audio' | 'screenshot', index: number }[] = [];
            const publishedArr: { type: 'audio' | 'screenshot', index: number }[] = [];

            // Use session status to determine artifact status
            const sessionStatus = session.status?.toLowerCase() || 'draft';
            const isSessionPublished = sessionStatus === 'published';
            const isSessionProcessed = sessionStatus === 'processed';

            // Check audio files
            if (session.audioFiles && session.audioFiles.length > 0) {
                for (let idx = 0; idx < session.audioFiles.length; idx++) {
                    const url = session.audioFiles[idx];
                    // Extract filename from both URLs for comparison
                    const audioFilename = url.split('/').pop();
                    const artifact = session.artifacts.find((a: any) => {
                        if (a.captureType === 'audio') {
                            const artifactFilename = a.url.split('/').pop();
                            return artifactFilename === audioFilename;
                        }
                        return false;
                    });

                    if (artifact && artifact._id) {
                        // Check if this specific artifact is vectorized
                        const isArtifactVectorized = session.vectorized_artifacts?.some((v: any) => v.artifact_id === artifact._id);

                        if (isSessionPublished || isArtifactVectorized) {
                            publishedArr.push({ type: 'audio', index: idx });
                        } else {
                            // For non-published sessions, check if this artifact has processed content
                            try {
                                const response = await fetch(`${getApiBaseUrl()}/artifacts/artifact-updates/latest/${artifact._id}`);
                                const data = await response.json();
                                if (data.content && data.content.length > 0) {
                                    processedArr.push({ type: 'audio', index: idx });
                                }
                            } catch (error) {
                                console.error('Error checking artifact processing status:', error);
                            }
                        }
                    }
                }
            }

            // Check screenshots
            if (session.screenshots && session.screenshots.length > 0) {
                for (let idx = 0; idx < session.screenshots.length; idx++) {
                    const url = session.screenshots[idx];
                    // Extract filename from both URLs for comparison
                    const screenshotFilename = url.split('/').pop();
                    const artifact = session.artifacts.find((a: any) => {
                        if (a.captureType === 'screenshot') {
                            const artifactFilename = a.url.split('/').pop();
                            return artifactFilename === screenshotFilename;
                        }
                        return false;
                    });

                    if (artifact && artifact._id) {
                        // Check if this specific artifact is vectorized
                        const isArtifactVectorized = session.vectorized_artifacts?.some((v: any) => v.artifact_id === artifact._id);

                        if (isSessionPublished || isArtifactVectorized) {
                            publishedArr.push({ type: 'screenshot', index: idx });
                        } else {
                            // For non-published sessions, check if this artifact has processed content
                            try {
                                const response = await fetch(`${getApiBaseUrl()}/artifacts/artifact-updates/latest/${artifact._id}`);
                                const data = await response.json();
                                if (data.content && data.content.length > 0) {
                                    processedArr.push({ type: 'screenshot', index: idx });
                                }
                            } catch (error) {
                                console.error('Error checking artifact processing status:', error);
                            }
                        }
                    }
                }
            }

            setProcessed(processedArr);
            setPublished(publishedArr);
        }
        checkProcessedArtifacts();
    }, [session]);

    // Add this after processed state is defined, inside the component body
    useEffect(() => {
        if (session && processed) {
            checkSessionProcessed();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processed]);

    useEffect(() => {
        console.log('session:', session);
    }, [session]);

    // Remove the automatic checkExistingTranscript useEffect to prevent text view from opening without Describe action
    // The text view should only open when user explicitly clicks "Describe" button

    if (loading) return <div>Loading...</div>;
    if (!session || session.error) return <div>Session not found.</div>;

    // Move checkSessionProcessed definition to the top, before any useEffect or usage
    const checkSessionProcessed = async () => {
        setEditLoading(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/sessions/${session.sessionId}/processed-texts`);
            const data = await res.json();
            if (Array.isArray(data)) {
                const allProcessed = data.length > 0 && data.every((a: any) => a.processedText && a.processedText.length > 0);
                setEditDisabled(!allProcessed);
            } else {
                setEditDisabled(true);
            }
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditSession = async () => {
        console.log('Edit button clicked');
        setEditLoading(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/sessions/${session.sessionId}/processed-texts`);
            const data = await res.json();
            console.log('Fetched processed texts:', data);
            if (Array.isArray(data)) {
                // Concatenate all processed texts with headings, separated by two newlines
                const content = data.map((a, i) => `--- ${a.captureType.toUpperCase()} - ${a.captureName} ---\n${a.processedText || ''}`)
                    .join('\n\n');
                console.log('Editor content:', content);
                setEditorInitialContent('');
                setEditorContent(content);
                setEditOpen(true);
            }
        } finally {
            setEditLoading(false);
        }
    };

    const handleProcessAllArtifacts = async () => {
        try {
            await fetch(`${getApiBaseUrl()}/sessions/${session.sessionId}/process`, {
                method: 'POST',
            });
            alert('Processing started for all artifacts in this session!');
        } catch (err: any) {
            alert('Failed to process all artifacts: ' + (err?.message || err));
        }
    };

    const handleVectorizeSession = async () => {
        setVectorizeLoading(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/sessions/${session.sessionId}/vectorize`, {
                method: 'POST',
            });
            const data = await res.json();
            alert(data.message || 'Vectorization complete!');
        } catch (err: any) {
            alert('Failed to vectorize session: ' + (err?.message || err));
        }
        setVectorizeLoading(false);
    };

    const handleVectorizeArtifact = async (type: 'audio' | 'screenshot', index: number) => {
        try {
            let artifact;
            if (type === 'audio') {
                const url = session.audioFiles[index];
                const urlFilename = url.split('/').pop();
                artifact = session.artifacts?.find((a: any) => a.captureType === 'audio' && a.url.split('/').pop() === urlFilename);
            } else {
                const url = session.screenshots[index];
                const urlFilename = url.split('/').pop();
                artifact = session.artifacts?.find((a: any) => a.captureType === 'screenshot' && a.url.split('/').pop() === urlFilename);
            }

            const artifactId = artifact?._id;
            if (!artifactId) {
                alert('No artifact found!');
                return;
            }

            const res = await fetch(`${getApiBaseUrl()}/sessions/${session.sessionId}/vectorize/${artifactId}`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.status === 'success') {
                alert('Artifact vectorized successfully!');
                // Refresh the session data to update the vectorized_artifacts
                window.location.reload();
            } else if (data.status === 'already_vectorized') {
                alert('Artifact is already vectorized!');
            } else {
                alert(data.message || 'Failed to vectorize artifact');
            }
        } catch (err: any) {
            alert('Failed to vectorize artifact: ' + (err?.message || err));
        }
    };

    // Calculate progress percentages based on actual session data
    const calculateProgressPercentages = () => {
        if (!session || !session.artifacts) {
            return { draft: 0, processed: 0, published: 0 };
        }

        const totalArtifacts = session.artifacts.length;
        if (totalArtifacts === 0) {
            return { draft: 0, processed: 0, published: 0 };
        }

        let draftCount = 0;
        let processedCount = 0;
        let publishedCount = 0;

        // Count artifacts by status
        session.artifacts.forEach((artifact: any) => {
            const isVectorized = session.vectorized_artifacts?.some((v: any) => v.artifact_id === artifact._id);

            if (isVectorized) {
                publishedCount++;
            } else {
                // Check if artifact has processed content
                const hasProcessedContent = processed.some((p: any) => {
                    if (p.type === 'audio') {
                        const audioUrl = session.audioFiles?.[p.index];
                        const audioFilename = audioUrl?.split('/').pop();
                        const artifactFilename = artifact.url?.split('/').pop();
                        return artifact.captureType === 'audio' && audioFilename === artifactFilename;
                    } else if (p.type === 'screenshot') {
                        const screenshotUrl = session.screenshots?.[p.index];
                        const screenshotFilename = screenshotUrl?.split('/').pop();
                        const artifactFilename = artifact.url?.split('/').pop();
                        return artifact.captureType === 'screenshot' && screenshotFilename === artifactFilename;
                    }
                    return false;
                });

                if (hasProcessedContent) {
                    processedCount++;
                } else {
                    draftCount++;
                }
            }
        });

        return {
            draft: Math.round((draftCount / totalArtifacts) * 100),
            processed: Math.round((processedCount / totalArtifacts) * 100),
            published: Math.round((publishedCount / totalArtifacts) * 100)
        };
    };

    const progressPercentages = calculateProgressPercentages();

    // Helper to delete artifact
    const handleDeleteArtifact = async () => {
        if (!deleteTarget) return;
        const { type, index } = deleteTarget;
        try {
            let artifactId;
            if (type === 'audio') {
                artifactId = session.audioArtifacts?.[index]?._id;
            } else {
                artifactId = session.screenshotArtifacts?.[index]?._id;
            }
            if (artifactId) {
                await ApiClient.delete(`/artifacts/${artifactId}`);
            }
            // Remove from UI
            if (type === 'audio') {
                const updatedAudio = [...session.audioFiles];
                updatedAudio.splice(index, 1);
                setSession({ ...session, audioFiles: updatedAudio });
            } else {
                const updatedScreenshots = [...session.screenshots];
                updatedScreenshots.splice(index, 1);
                setSession({ ...session, screenshots: updatedScreenshots });
            }
        } catch (err) {
            alert('Failed to delete artifact.');
        } finally {
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    };

    // Helper to process artifact
    const handleProcessArtifact = async (type: 'audio' | 'screenshot', index: number) => {
        setProcessing({ type, index });
        try {
            let artifact;
            if (type === 'audio') {
                const url = session.audioFiles[index];
                const urlFilename = url.split('/').pop();
                console.log('Looking for filename:', urlFilename);
                console.log('Artifact filenames:', session.artifacts?.map((a: any) => a.url.split('/').pop()));
                artifact = session.artifacts?.find((a: any) => a.captureType === 'audio' && a.url.split('/').pop() === urlFilename);
            } else {
                const url = session.screenshots[index];
                const urlFilename = url.split('/').pop();
                console.log('Looking for filename:', urlFilename);
                console.log('Artifact filenames:', session.artifacts?.map((a: any) => a.url.split('/').pop()));
                artifact = session.artifacts?.find((a: any) => a.captureType === 'screenshot' && a.url.split('/').pop() === urlFilename);
            }
            const artifactId = artifact?._id;
            console.log('artifactId:', artifactId);
            if (!artifactId) {
                alert('No artifactId found!');
                return;
            }
            try {
                await ApiClient.post(`/artifacts/${artifactId}/process`, { priority: 'medium' });
                setProcessed(prev => {
                    const exists = prev.some((p: any) => p.type === type && p.index === index);
                    return exists ? prev : [...prev, { type, index }];
                });
            } catch (err: any) {
                console.error('API error:', err);
                alert('API error: ' + (err?.message || err));
            }
        } finally {
            setProcessing(null);
        }
    };

    // Handler for edit button in processed text modal
    const handleEditProcessedText = async () => {
        if (!editorArtifactId) {
            alert('No artifact selected for editing.');
            return;
        }
        setEditLoading(true);
        try {
            const response = await fetch(`${getApiBaseUrl()}/artifacts/artifact-updates/latest/${editorArtifactId}`);
            const data = await response.json();
            setEditorContent('');
            setEditorInitialContent(data.content || '');
            setEditOpen(true);
        } catch (err) {
            alert('Failed to fetch latest text for editing.');
        } finally {
            setEditLoading(false);
        }
    };

    // Handler for saving edited text
    const handleSaveEditedText = async (newContent: string) => {
        if (!editorArtifactId) {
            alert('No artifact selected for saving.');
            setEditOpen(false);
            return;
        }
        try {
            await fetch(`${getApiBaseUrl()}/artifacts/${editorArtifactId}/content`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent })
            });
            // Re-fetch the latest processed text from backend after save
            const response = await fetch(`${getApiBaseUrl()}/artifacts/artifact-updates/latest/${editorArtifactId}`);
            const data = await response.json();
            setViewText(data.content || newContent);
            setEditOpen(false);
            setViewOpen(false); // Close modal first
            setTimeout(() => setViewOpen(true), 0); // Reopen to trigger useEffect and fetch latest
        } catch (err) {
            alert('Failed to save edited text.');
        }
    };

    // Handler for view button (add artifactId to state for editing)
    const handleViewProcessedText = async (type: 'audio' | 'screenshot', index: number) => {
        setViewLoading(true);
        setViewError('');
        setViewText('');
        let artifact;
        if (type === 'audio') {
            const url = session.audioFiles[index];
            const urlFilename = url.split('/').pop();
            artifact = session.artifacts?.find((a: any) => a.captureType === 'audio' && a.url.split('/').pop() === urlFilename);
        } else {
            const url = session.screenshots[index];
            const urlFilename = url.split('/').pop();
            artifact = session.artifacts?.find((a: any) => a.captureType === 'screenshot' && a.url.split('/').pop() === urlFilename);
        }
        const artifactId = artifact?._id;
        if (!artifactId) {
            setEditorArtifactId(null);
        } else {
            setEditorArtifactId(artifactId);
        }
        let processedText = '';
        if (artifactId) {
            try {
                const response = await fetch(`${getApiBaseUrl()}/artifacts/artifact-updates/latest/${artifactId}`);
                const data = await response.json();
                processedText = data.content || '';
            } catch (err) {
                setViewError('Failed to fetch processed text.');
            }
        } else {
            setViewError('No artifactId found.');
        }
        setViewText(processedText);
        setViewLoading(false);
        setViewOpen(true);
        setCopied(false);
    };

    // Calculate if all artifacts are processed
    const totalArtifacts = (session?.audioFiles?.length || 0) + (session?.screenshots?.length || 0);
    const allProcessed = totalArtifacts > 0 && processed.length === totalArtifacts;

    // Helper to update all artifacts' processedText
    async function updateAllArtifactsFromEditor(content: string) {
        if (!session || !session.artifacts) return;
        // Split content by headings
        const sections = content.split(/--- (AUDIO|SCREENSHOT) - (.+?) ---/g).slice(1);
        console.log('Parsed sections:', sections);
        // sections is [type1, name1, text1, type2, name2, text2, ...]
        for (let i = 0; i < sections.length; i += 3) {
            const type = sections[i]?.toLowerCase();
            const name = sections[i + 1]?.trim();
            const text = sections[i + 2]?.trim();
            console.log('Updating artifact:', { type, name, text });
            if (!type || !name) continue;
            const artifact = session.artifacts.find((a: any) => a.captureType === type && a.captureName === name);
            if (artifact && artifact._id) {
                try {
                    const res = await fetch(`${getApiBaseUrl()}/artifacts/${artifact._id}/content`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: text })
                    });
                    console.log('Update response:', await res.text());
                } catch (err) {
                    console.error('Error updating artifact:', err);
                }
            } else {
                console.warn('Artifact not found for update:', { type, name });
            }
        }
    }

    // Helper to fetch and update editor content from backend
    async function fetchAndSetEditorContent() {
        if (!session) return;
        const res = await fetch(`${getApiBaseUrl()}/sessions/${session.sessionId}/processed-texts`);
        const data = await res.json();
        if (Array.isArray(data)) {
            const content = data.map((a: any) => `--- ${a.captureType.toUpperCase()} - ${a.captureName} ---\n${a.processedText || ''}`)
                .join('\n\n');
            setEditorContent(content);
        }
    }

    // Pass this to DocumentEditor onSave
    const handleCombinedEditorSave = async (newContent: string) => {
        setPendingSaveContent(newContent);
        setShowSaveConfirm(true);
    };

    // Audio player state and handlers
    const handlePlayPause = (index: number) => {
        console.log('handlePlayPause called for index:', index);
        console.log('audioRefs.current:', audioRefs.current);
        const audio = audioRefs.current[index];
        console.log('audio element:', audio);
        if (audio) {
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
                setAudioStates(prev => prev.map((s, i) => i === index ? { ...s, playing: true } : s));
            } else {
                audio.pause();
                setAudioStates(prev => prev.map((s, i) => i === index ? { ...s, playing: false } : s));
            }
        } else {
            console.error('Audio element not found for index:', index);
        }
    };

    const handleMute = (index: number) => {
        const audio = audioRefs.current[index];
        if (audio) {
            const newState = !audio.muted;
            audio.muted = newState;
            setAudioStates(prev => prev.map((s, i) => i === index ? { ...s, muted: newState } : s));
        }
    };

    const handleTimeUpdate = (index: number) => {
        const audio = audioRefs.current[index];
        if (audio) {
            console.log(`Time update for index ${index}: currentTime=${audio.currentTime}, duration=${audio.duration}`);
            setAudioStates(prev => prev.map((s, i) => i === index ? {
                ...s,
                currentTime: audio.currentTime,
                duration: audio.duration || s.duration
            } : s));
        }
    };

    const handleSeek = (index: number, time: number) => {
        const audio = audioRefs.current[index];
        if (audio) {
            audio.currentTime = time;
        }
    };

    const handleLoadedMetadata = (index: number) => {
        const audio = audioRefs.current[index];
        if (audio) {
            console.log(`Loaded metadata for index ${index}: duration=${audio.duration}`);
            setAudioStates(prev => prev.map((s, i) => i === index ? {
                ...s,
                duration: audio.duration,
                currentTime: audio.currentTime
            } : s));
        }
    };

    const loadAudioDuration = (index: number) => {
        const audio = audioRefs.current[index];
        if (audio) {
            console.log(`Manually loading duration for audio ${index}`);
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

    // Function to get artifact status (Draft, Processed, or Published)
    const getArtifactStatus = (type: 'audio' | 'screenshot', index: number): { status: string; color: string; bgColor: string } => {
        const isProcessed = processed.some(p => p.type === type && p.index === index);
        const isPublished = published.some(p => p.type === type && p.index === index);

        if (isPublished) {
            return {
                status: 'Published',
                color: '#2E7D32',
                bgColor: '#E8F5E8'
            };
        } else if (isProcessed) {
            return {
                status: 'Processed',
                color: '#3CA1E8',
                bgColor: '#E6F4F9'
            };
        } else {
            return {
                status: 'Draft',
                color: '#C97A2B',
                bgColor: '#FFF4E6'
            };
        }
    };



    // Handler to delete selected images
    const handleDeleteSelectedImages = () => {
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!session || !session.screenshots) return;
        let failed = false;
        // For each selected image, find its artifactId and call the delete API
        for (const idx of selectedImages) {
            const url = session.screenshots[idx];
            const urlFilename = url.split('/').pop();
            const artifact = session.artifacts.find((a: any) => a.captureType === 'screenshot' && a.url.split('/').pop() === urlFilename);
            if (artifact && artifact._id) {
                try {
                    await ApiClient.delete(`/artifacts/${artifact._id}`);
                } catch (err) {
                    failed = true;
                }
            }
        }
        // Remove selected images from UI
        const newScreenshots = session.screenshots.filter((_: string, idx: number) => !selectedImages.includes(idx));
        // Update session in backend
        try {
            await ApiClient.put(`/sessions/${session.sessionId}`, {
                screenshots: newScreenshots
            });
        } catch (err) {
            failed = true;
        }
        setSession({ ...session, screenshots: newScreenshots });
        setSelectedImages([]);
        setSelectMode(false);
        setDeleteConfirmOpen(false);
        if (failed) {
            alert('Some images could not be deleted from the server or session could not be updated.');
        }
    };

    const handleCancelDelete = () => {
        setDeleteConfirmOpen(false);
    };

    // Handler for Describe button
    const handleDescribe = async () => {
        setDescribeLoading(true);
        setIsPublished(false);

        // Get selected screenshot artifacts
        const screenshotArtifacts = session.artifacts.filter((a: any) => a.captureType === 'screenshot');
        const selectedScreenshotArtifacts = selectedImages.map(idx => screenshotArtifacts[idx]);

        // Get selected audio artifacts (always selected)
        const audioArtifacts = session.artifacts.filter((a: any) => a.captureType === 'audio');
        const filteredAudioArtifacts = audioArtifacts.filter((a: any) => selectedAudioArtifacts.includes(a._id));

        // Combine all selected artifacts
        const allSelectedArtifacts = [...selectedScreenshotArtifacts, ...filteredAudioArtifacts];

        if (allSelectedArtifacts.length === 0) {
            setDescribeLoading(false);
            return;
        }

        // 1. Process each selected artifact
        await Promise.all(allSelectedArtifacts.map(artifact =>
            ApiClient.post(`/artifacts/${artifact._id}/process`, { priority: 'medium' })
        ));

        // 2. Fetch processed text for each
        const processedTexts = await Promise.all(allSelectedArtifacts.map(async (artifact, index) => {
            const res = await ApiClient.get(`/artifacts/artifact-updates/latest/${artifact._id}`) as any;
            const content = res.content || '';

            // Add label based on artifact type and index
            let label = '';
            if (artifact.captureType === 'screenshot') {
                label = `Image ${index + 1}:`;
            } else if (artifact.captureType === 'audio') {
                label = `Audio ${index + 1}:`;
            } else {
                label = `Artifact ${index + 1}:`;
            }

            return `${label}\n${content}`;
        }));

        // 3. Combine and display
        setTranscript(processedTexts.join('\n\n'));
        setHasTranscript(true);
        setDescribeLoading(false);
    };

    const handleReDescribe = () => {
        setHasTranscript(false);
        setTranscript('');
        setIsPublished(false);

        // Log the session re-describe activity
        try {
            ApiClient.logActivity({
                activity_type: 'session_processed',
                description: 'Session re-described/processed',
                session_id: sessionId as string,
                project_id: session?.projectId,
                metadata: {
                    action: 're_describe'
                }
            });
        } catch (logError) {
            console.error('Failed to log session re-describe activity:', logError);
        }
    };

    // Handle Edit button click in Transcription/Description section
    const handleEditTranscription = () => {
        setDocumentEditorContent(transcript);
        setShowDocumentEditor(true);
    };

    // Handle save from DocumentEditor
    const handleDocumentEditorSave = (newContent: string) => {
        setTranscript(newContent);
        setShowDocumentEditor(false);
        // Here you could also save to backend if needed
    };

    // Handle close from DocumentEditor
    const handleDocumentEditorClose = (hasUnsavedChanges: boolean) => {
        if (hasUnsavedChanges) {
            if (window.confirm('You have unsaved changes. Exit without saving?')) {
                setShowDocumentEditor(false);
            }
        } else {
            setShowDocumentEditor(false);
        }
    };

    // Inline editor handlers
    const handleStartInlineEdit = () => {
        setInlineEditorContent(transcript);
        setIsEditingInline(true);
        if (inlineEditor && transcript) {
            inlineEditor.commands.setContent(transcript);
        }
    };

    const handleSaveInlineEdit = () => {
        setTranscript(inlineEditorContent);
        setIsEditingInline(false);
        // Here you could also save to backend if needed
    };

    const handleCancelInlineEdit = () => {
        setIsEditingInline(false);
        setInlineEditorContent('');
    };

    // PDF Download function
    const handleDownloadPDF = async () => {
        if (!transcript || transcript.trim() === '') {
            alert('No content to download. Please process some content first.');
            return;
        }

        try {
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
            const title = `Session: ${session?.sessionName || session?.sessionId || 'Unknown Session'}`;
            pdf.text(title, 20, 15);

            // Reset text color for content
            pdf.setTextColor(0, 0, 0);

            // Add session metadata
            yPosition = 35;
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Session Details:', 20, yPosition);

            yPosition += 8;
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Session ID: ${session?.sessionId || 'Unknown'}`, 25, yPosition);
            yPosition += 6;
            pdf.text(`Created: ${session?.createdByName || 'Unknown'}, ${session?.createdAt ? new Date(session.createdAt).toLocaleString() : 'Unknown'}`, 25, yPosition);
            yPosition += 6;
            pdf.text(`Project: ${projectName || 'Unknown'}`, 25, yPosition);

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
            pdf.text('Transcription / Description', 20, yPosition);

            // Reset text color for content
            yPosition += 8;
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');

            // Process the transcript content with better formatting
            const lines = transcript.split('\n');

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
            const fileName = `session_${session?.sessionName || session?.sessionId || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            // Log the download activity
            try {
                await ApiClient.logActivity({
                    activity_type: 'session_downloaded',
                    description: 'Session content downloaded as PDF',
                    session_id: sessionId as string,
                    project_id: session?.projectId,
                    metadata: {
                        download_type: 'pdf',
                        content_length: transcript.length
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

    const handleArtifactClick = (artifactId: string) => {
        router.push(`/artifacts/${artifactId}?sessionId=${sessionId}`);
    };

    const handlePublishSession = async (options: { chatbot: boolean; blog: boolean; selectedArtifactIds?: string[] }) => {
        setPublishLoading(true);
        try {
            // Get the selected artifact IDs from the current selection state
            const selectedArtifactIds: string[] = [];

            // Add selected image artifacts
            selectedImages.forEach(imageIndex => {
                if (artifacts[imageIndex] && artifacts[imageIndex]._id) {
                    selectedArtifactIds.push(artifacts[imageIndex]._id);
                }
            });

            // Add selected audio artifacts
            selectedAudioArtifacts.forEach(audioId => {
                if (audioId) {
                    selectedArtifactIds.push(audioId);
                }
            });

            // If no specific artifacts are selected, use all processed artifacts (backward compatibility)
            const finalSelectedArtifactIds = selectedArtifactIds.length > 0 ? selectedArtifactIds : undefined;

            // Debug logging
            console.log('Publishing session with selected artifacts:', {
                selectedImages,
                selectedAudioArtifacts,
                selectedArtifactIds,
                finalSelectedArtifactIds,
                totalArtifacts: artifacts.length
            });

            // Call the API to publish the session
            await ApiClient.post(`/sessions/${sessionId}/publish`, {
                publishToChatbot: options.chatbot,
                publishToBlog: options.blog,
                selectedArtifactIds: finalSelectedArtifactIds,
            });
            setShowPublishModal(false);
            setIsPublished(true);

            // Log the session publish activity
            try {
                let description = 'Session published';
                if (options.chatbot && options.blog) {
                    description = 'Session published to both chatbot and blog';
                } else if (options.chatbot) {
                    description = 'Session published to chatbot';
                } else if (options.blog) {
                    description = 'Session published to blog';
                }

                await ApiClient.logActivity({
                    activity_type: 'session_published',
                    description: description,
                    session_id: sessionId as string,
                    project_id: session?.projectId,
                    metadata: {
                        publishToChatbot: options.chatbot,
                        publishToBlog: options.blog
                    }
                });
            } catch (logError) {
                console.error('Failed to log session publish activity:', logError);
            }

            // You could add a success notification here
        } catch (error) {
            console.error('Error publishing session:', error);
            // You could add an error notification here
        } finally {
            setPublishLoading(false);
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
            <Box sx={{ bgcolor: '#fafbfc', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
                <Header />
                {/* Purple Banner */}
                <Box sx={{ width: '100%', height: 160, background: 'url(/purple-bg.png) center/cover no-repeat', mb: { xs: 2, md: 4 } }} />
                {/* Centered Main Content with fixed width for alignment */}
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: 1114, mx: 'auto', pt: 4 }}>
                        {/* Breadcrumb */}
                        <Breadcrumbs sx={{ mb: 1 }} aria-label="breadcrumb">
                            <Link underline="hover" color="inherit" href="/dashboard">Dashboard</Link>
                            <Link underline="hover" color="inherit" href={session.projectId ? `/projects/${session.projectId}` : '#'}>
                                Project {projectName || ''}
                            </Link>
                            <Typography color="text.primary" fontWeight={700}>Session {session.sessionId || ''}</Typography>
                        </Breadcrumbs>
                        {/* Main Content will go here next */}
                        <Box sx={{ width: '1114px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                            <Box>
                                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                                    {session.sessionName || session.sessionId || 'Session'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Created: {session.createdByName || 'Unknown'}{session.createdAt ? `, ${new Date(session.createdAt).toLocaleString()}` : ''}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: 400 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
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
                                >
                                    Transcribe / Describe
                                </Button>
                            </Box>
                        </Box>
                        {/* Progress Bars */}
                        <Box sx={{
                            mb: 6,
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                        }}>
                            {/* Draft Bar */}
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography sx={{ fontWeight: 500 }}>Draft</Typography>
                                    <Typography sx={{ fontWeight: 600 }}>{progressPercentages.draft}%</Typography>
                                </Box>
                                <Box sx={{ position: 'relative', height: 8, bgcolor: '#E5EAF2', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
                                    <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progressPercentages.draft}%`, bgcolor: '#C97A2B', borderRadius: 4 }} />
                                </Box>
                            </Box>
                            {/* Processed Bar */}
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography sx={{ fontWeight: 500 }}>Processed</Typography>
                                    <Typography sx={{ fontWeight: 600 }}>{progressPercentages.processed}%</Typography>
                                </Box>
                                <Box sx={{ position: 'relative', height: 8, bgcolor: '#E5EAF2', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
                                    <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progressPercentages.processed}%`, bgcolor: '#3CA1E8', borderRadius: 4 }} />
                                </Box>
                            </Box>
                            {/* Published Bar */}
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography sx={{ fontWeight: 500 }}>Published</Typography>
                                    <Typography sx={{ fontWeight: 600 }}>{progressPercentages.published}%</Typography>
                                </Box>
                                <Box sx={{ position: 'relative', height: 8, bgcolor: '#E5EAF2', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
                                    <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progressPercentages.published}%`, bgcolor: '#3CC97A', borderRadius: 4 }} />
                                </Box>
                            </Box>
                        </Box>
                        {/* Audio Section */}
                        <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>Audio</Typography>
                        <Box sx={{ display: 'flex', gap: 4, mb: 6 }}>
                            {session.audioFiles && session.audioFiles.length > 0 ? (
                                session.audioFiles.map((url: string, idx: number) => {
                                    const audioUrl = url; // URL is already complete from backend
                                    console.log(`Audio ${idx + 1} URL:`, audioUrl);
                                    const state = audioStates[idx] || { playing: false, muted: false, currentTime: 0, duration: 0 };
                                    return (
                                        <Card
                                            key={url}
                                            sx={{
                                                minWidth: 320,
                                                maxWidth: 380,
                                                p: 0,
                                                borderRadius: 3,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                position: 'relative',
                                                overflow: 'visible',
                                                border: '2px solid #3CA1E8', // Blue border
                                                boxShadow: '0 0 0 2px #B6E0FE', // Blue glow
                                            }}
                                        >
                                            {/* Blue Image with Real Audio Controls */}
                                            <Box sx={{ width: 320, height: 180, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: `linear-gradient(135deg, #0a4a72 0%, #000 100%)`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                                                {/* Centered lines image */}
                                                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', zIndex: 1 }}>
                                                    <img src="/lines.png" alt="waveform" style={{ width: 180, height: 40, objectFit: 'contain', opacity: 0.7 }} />
                                                </Box>
                                                <audio
                                                    ref={el => {
                                                        audioRefs.current[idx] = el;
                                                        console.log(`Audio ref set for index ${idx}:`, el);
                                                    }}
                                                    src={audioUrl}
                                                    onTimeUpdate={() => handleTimeUpdate(idx)}
                                                    onPlay={() => handleTimeUpdate(idx)}
                                                    onPause={() => handleTimeUpdate(idx)}
                                                    onLoadedMetadata={() => handleLoadedMetadata(idx)}
                                                    onCanPlay={() => {
                                                        console.log(`Audio can play for index ${idx}`);
                                                        handleLoadedMetadata(idx);
                                                    }}
                                                    onError={(e) => console.error(`Audio error for index ${idx}:`, e)}
                                                    preload="metadata"
                                                    style={{ display: 'none' }}
                                                />
                                                <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, px: 3, py: 2, display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', background: 'rgba(0,0,0,0.0)', zIndex: 2 }}>
                                                    <Button onClick={() => handlePlayPause(idx)} variant="text" sx={{ minWidth: 0, width: 32, height: 32, borderRadius: '50%', color: '#fff', p: 0 }}>
                                                        {state.playing ? <PauseIcon sx={{ fontSize: 28 }} /> : <PlayArrowIcon sx={{ fontSize: 28 }} />}
                                                    </Button>
                                                    <Button onClick={() => handleMute(idx)} variant="text" sx={{ minWidth: 0, width: 32, height: 32, borderRadius: '50%', color: '#fff', p: 0, ml: 0.5 }}>
                                                        {state.muted ? <VolumeOffIcon sx={{ fontSize: 22 }} /> : <VolumeUpIcon sx={{ fontSize: 22 }} />}
                                                    </Button>
                                                    <Typography sx={{ color: '#fff', fontSize: 15, minWidth: 38, textAlign: 'right', ml: 1 }}>{formatTime(state.currentTime)}</Typography>
                                                    <Box sx={{ flex: 1, mx: 2, display: 'flex', alignItems: 'center' }}>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={state.duration || 1}
                                                            value={state.currentTime}
                                                            onChange={e => handleSeek(idx, Number(e.target.value))}
                                                            style={{
                                                                width: '100%',
                                                                accentColor: '#00AAF8',
                                                                background: `linear-gradient(to right, #00AAF8 ${(state.currentTime / (state.duration || 1)) * 100}%, #B0B8C1 ${(state.currentTime / (state.duration || 1)) * 100}%)`,
                                                                height: 4,
                                                                borderRadius: 2,
                                                                outline: 'none',
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography sx={{ color: '#fff', fontSize: 15, minWidth: 38, textAlign: 'left', ml: 1 }}>{formatTime(state.duration)}</Typography>
                                                </Box>
                                            </Box>
                                            {/* Label and Status Badge */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', p: 2 }}>
                                                <Typography fontWeight={600} sx={{ fontSize: 18 }}>{`Audio ${idx + 1}`}</Typography>
                                                {(() => {
                                                    const statusInfo = getArtifactStatus('audio', idx);
                                                    return (
                                                        <Box sx={{
                                                            bgcolor: statusInfo.bgColor,
                                                            color: statusInfo.color,
                                                            fontWeight: 600,
                                                            borderRadius: 999,
                                                            px: 2.5,
                                                            py: 0.5,
                                                            fontSize: 16,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            minWidth: 0,
                                                        }}>
                                                            {statusInfo.status}
                                                        </Box>
                                                    );
                                                })()}
                                            </Box>
                                        </Card>
                                    )
                                })
                            ) : (
                                <Typography sx={{ color: '#888', fontSize: 16, mt: 2 }}>No audio files found for this session.</Typography>
                            )}
                        </Box>
                        {/* Images Section */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5" fontWeight={600}>Images</Typography>
                            {selectMode ? (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="text"
                                        sx={{ color: '#E53935', fontWeight: 600, minWidth: 0, p: 0, textTransform: 'none', fontSize: 16 }}
                                        onClick={handleDeleteSelectedImages}
                                        disabled={selectedImages.length === 0}
                                    >
                                        Delete
                                    </Button>
                                    <Button
                                        variant="text"
                                        sx={{ color: '#3CA1E8', fontWeight: 600, minWidth: 0, p: 0, textTransform: 'none', fontSize: 16 }}
                                        onClick={() => { setSelectMode(false); setSelectedImages([]); }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            ) : (
                                <Link
                                    href="#"
                                    underline="hover"
                                    sx={{ fontWeight: 600, color: '#3CA1E8', fontSize: 16, cursor: 'pointer' }}
                                    onClick={e => {
                                        e.preventDefault();
                                        setSelectMode(true);
                                    }}
                                >
                                    Select
                                </Link>
                            )}
                        </Box>
                        {/* Delete Confirmation Dialog */}
                        <Dialog
                            open={deleteConfirmOpen}
                            onClose={handleCancelDelete}
                            PaperProps={{
                                sx: {
                                    borderRadius: 3,
                                    p: 2,
                                    minWidth: 340,
                                    maxWidth: 400,
                                    textAlign: 'center',
                                },
                            }}
                        >
                            <DialogTitle sx={{ fontWeight: 700, fontSize: 20, pb: 1, pt: 2 }}>Delete selected images?</DialogTitle>
                            <DialogContent sx={{ pb: 2, color: '#555', fontSize: 16 }}>
                                Are you sure you want to delete the selected image(s)? This action cannot be undone.
                            </DialogContent>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, pb: 2 }}>
                                <Button
                                    variant="contained"
                                    sx={{ bgcolor: '#E53935', color: '#fff', fontWeight: 700, borderRadius: 2, px: 3, textTransform: 'none', '&:hover': { bgcolor: '#b71c1c' } }}
                                    onClick={handleConfirmDelete}
                                >
                                    Delete
                                </Button>
                                <Button
                                    variant="outlined"
                                    sx={{ color: '#3CA1E8', borderColor: '#3CA1E8', fontWeight: 700, borderRadius: 2, px: 3, textTransform: 'none', '&:hover': { bgcolor: '#E3F2FD', borderColor: '#3CA1E8' } }}
                                    onClick={handleCancelDelete}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Dialog>
                        <Box sx={{
                            mb: 6,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '32px 24px',
                        }}>
                            {session.artifacts && session.artifacts.filter((a: Artifact) => a.captureType === 'screenshot').length > 0 ? (
                                session.artifacts.filter((a: Artifact) => a.captureType === 'screenshot').map((artifact: Artifact, idx: number) => {
                                    const imageUrl = `${getApiBaseUrl()}${artifact.url.replace('/storage', '/media')}`;
                                    return (
                                        <Box
                                            key={artifact._id}
                                            sx={{
                                                display: 'inline-flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                gap: '12px',
                                                padding: '20px 20px 12px 20px',
                                                borderRadius: '16px',
                                                border: selectedImages.includes(idx) && selectMode ? '2px solid #3CA1E8' : '1px solid #E5E5EA',
                                                boxShadow: selectedImages.includes(idx) && selectMode ? '0 0 0 2px #B6E0FE' : undefined,
                                                background: '#FFF',
                                                width: '100%',
                                                minHeight: 240,
                                                boxSizing: 'border-box',
                                                cursor: 'pointer',
                                                transition: 'box-shadow 0.2s, border-color 0.2s',
                                                '&:hover': {
                                                    boxShadow: 4,
                                                    borderColor: '#3CA1E8',
                                                },
                                            }}
                                            onClick={() => {
                                                if (selectMode) {
                                                    handleSelectImage(idx);
                                                } else {
                                                    handleArtifactClick(artifact._id);
                                                }
                                            }}
                                        >
                                            <Box sx={{ width: '100%', height: 226, borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <img src={imageUrl} alt={`Image ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                                <Typography fontWeight={600} sx={{ fontSize: 16 }}>{`Image ${idx + 1}`}</Typography>
                                                {(() => {
                                                    const statusInfo = getArtifactStatus('screenshot', idx);
                                                    return (
                                                        <Box sx={{
                                                            bgcolor: statusInfo.bgColor,
                                                            color: statusInfo.color,
                                                            fontWeight: 600,
                                                            borderRadius: 999,
                                                            px: 2.5,
                                                            py: 0.5,
                                                            fontSize: 14,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            minWidth: 0,
                                                        }}>
                                                            {statusInfo.status}
                                                        </Box>
                                                    );
                                                })()}
                                            </Box>
                                        </Box>
                                    )
                                })
                            ) : (
                                <Typography sx={{ color: '#888', fontSize: 16, mt: 2 }}>No images found for this session.</Typography>
                            )}
                        </Box>
                        {/* Transcription / Description Section */}
                        <Box sx={{ mb: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pl: 2 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ textAlign: 'left' }}>
                                    Transcription / Description
                                </Typography>
                                {/* Cloud download button */}
                                <Button
                                    onClick={handleDownloadPDF}
                                    disabled={!hasTranscript || !transcript || transcript.trim() === ''}
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
                                            filter: !hasTranscript || !transcript || transcript.trim() === '' ? 'grayscale(100%)' : 'none'
                                        }}
                                    />
                                </Button>
                            </Box>
                            {!hasTranscript ? (
                                <Box sx={{ border: '1px solid #E5E5EA', borderRadius: '16px', background: '#fff', px: 0, py: 4, width: '100%', mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ mb: 3, mt: 1 }}>
                                        <img src="/oneee.png" alt="Transcription Illustration" style={{ width: 300, height: 160, objectFit: 'contain' }} />
                                    </Box>
                                    <Typography sx={{ mb: 3, color: '#222', textAlign: 'center', fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%' }}>
                                        Transcribe or Describe your session - edit or refine it before publishing.
                                    </Typography>
                                    <Typography sx={{ mb: 3, color: '#666', textAlign: 'center', fontSize: 14, fontStyle: 'italic' }}>
                                        Audio artifacts are automatically selected • Select images to include them
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        sx={{ fontWeight: 600, fontSize: 16, borderRadius: 2, px: 4, py: 1.5, minWidth: 140, height: 48, '&:hover': { bgcolor: '#0095d5' } }}
                                        onClick={handleDescribe}
                                        disabled={describeLoading || (selectedImages.length === 0 && selectedAudioArtifacts.length === 0)}
                                    >
                                        {describeLoading ? 'Processing...' : 'Describe'}
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ position: 'relative' }}>
                                    {isEditingInline ? (
                                        <>
                                            {/* Inline Editor with Toolbar */}
                                            <Box sx={{
                                                width: 1114,
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
                                            {/* Buttons positioned outside the box at bottom right */}
                                            <Box sx={{
                                                display: 'flex',
                                                gap: 2,
                                                justifyContent: 'flex-end',
                                                mt: 2,
                                                pr: 1
                                            }}>
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
                                        </>
                                    ) : (
                                        <>
                                            {/* Text box containing only the text, with new style */}
                                            <Box sx={{
                                                width: 1114,
                                                height: 220,
                                                flexShrink: 0,
                                                borderRadius: '12px',
                                                border: '1px solid #D4DBE3',
                                                background: '#fff',
                                                px: 3,
                                                py: 3,
                                                mx: 'auto',
                                                minHeight: 120
                                            }}>
                                                <textarea
                                                    value={transcript}
                                                    readOnly
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        border: 'none',
                                                        outline: 'none',
                                                        resize: 'none',
                                                        fontSize: 15,
                                                        background: 'transparent',
                                                        color: '#222',
                                                        fontFamily: 'inherit',
                                                        overflowY: 'auto',
                                                        overflowX: 'hidden',
                                                        lineHeight: '1.5',
                                                        padding: '0'
                                                    }}
                                                />
                                            </Box>
                                            {/* Buttons positioned outside the box at bottom right */}
                                            <Box sx={{
                                                display: 'flex',
                                                gap: 2,
                                                justifyContent: 'flex-end',
                                                mt: 2,
                                                pr: 1
                                            }}>
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
                                                    onClick={handleStartInlineEdit}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => setShowPublishModal(true)}
                                                    sx={{
                                                        bgcolor: '#4CAF50',
                                                        fontWeight: 600,
                                                        '&:hover': { bgcolor: '#45a049' }
                                                    }}
                                                >
                                                    {isPublished ? 'Re-publish' : 'Publish'}
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    onClick={handleReDescribe}
                                                    sx={{
                                                        bgcolor: '#3CA1E8',
                                                        fontWeight: 600,
                                                        '&:hover': { bgcolor: '#0095d5' }
                                                    }}
                                                >
                                                    Re-Describe
                                                </Button>
                                            </Box>
                                        </>
                                    )}
                                </Box>
                            )}
                        </Box>
                        {/* Log History Section */}
                        <Box sx={{ mb: 8 }}>
                            <ActivityLogList
                                type="session"
                                id={String(sessionId) || ''}
                                title="Log history"
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Publish Session Modal */}
            <PublishSessionModal
                open={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onPublish={handlePublishSession}
                loading={publishLoading}
                selectedArtifactIds={(() => {
                    const selectedIds: string[] = [];

                    // Add selected image artifacts
                    selectedImages.forEach(imageIndex => {
                        if (artifacts[imageIndex] && artifacts[imageIndex]._id) {
                            selectedIds.push(artifacts[imageIndex]._id);
                        }
                    });

                    // Add selected audio artifacts
                    selectedAudioArtifacts.forEach(audioId => {
                        if (audioId) {
                            selectedIds.push(audioId);
                        }
                    });

                    return selectedIds;
                })()}
            />
        </>
    );
} 