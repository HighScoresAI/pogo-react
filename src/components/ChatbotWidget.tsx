'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Fab,
    Dialog,
    DialogContent,
    IconButton,
    Typography,
    Paper,
    Badge,
    Slide,
    Fade,
    Zoom,
    CircularProgress,
} from '@mui/material';
import {
    Chat as ChatIcon,
    Close as CloseIcon,
    SmartToy as BotIcon,
    SmartToy,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

// Chat interface components
import ChatInterface from './chat/ChatInterface';

// Services and types
import chatService, { ChatMessage, ChatSession } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { useProjectContext } from '../hooks/useProjectContext';

interface ChatbotWidgetProps {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: 'light' | 'dark';
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<HTMLElement>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ChatbotWidget({
    position = 'bottom-right',
    theme = 'light'
}: ChatbotWidgetProps) {
    const { userId, isLoggedIn, getToken } = useAuth();
    const { projectId, projectName, sessionId, sessionName, isProjectPage, isSessionPage } = useProjectContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [contextLoaded, setContextLoaded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize welcome message when context is available
    useEffect(() => {
        if (messages.length === 0) {
            let welcomeMessage = 'Hello! I\'m your AI assistant. How can I help you today?';

            if (isSessionPage && sessionName) {
                welcomeMessage = `Hello! I'm your AI assistant for session "${sessionName}". I can help you with questions about this session, its artifacts, and processing status. How can I help you today?`;
            } else if (isProjectPage && projectName) {
                welcomeMessage = `Hello! I'm your AI assistant for ${projectName}. I can help you with project overview, session management, artifact processing status, and cross-session analysis. How can I help you today?`;
            }

            console.log('ChatbotWidget: Initializing welcome message:', welcomeMessage);
            setMessages([{
                id: '1',
                message: welcomeMessage,
                sender: 'bot',
                timestamp: new Date(),
                status: 'sent'
            }]);
        }
    }, [isProjectPage, isSessionPage, projectName, sessionName]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Update unread count when chat is closed
    useEffect(() => {
        if (!isOpen && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.sender === 'bot' && lastMessage.status === 'sent') {
                setUnreadCount(prev => prev + 1);
            }
        }
    }, [messages, isOpen]);

    // Debug: Log userId when component mounts
    useEffect(() => {
        console.log('ChatbotWidget: Current userId:', userId);
        console.log('ChatbotWidget: User logged in:', isLoggedIn);
        console.log('ChatbotWidget: Token available:', !!getToken());
        console.log('ChatbotWidget: Auth context working:', !!useAuth);

        // Additional debugging
        if (typeof window !== 'undefined') {
            console.log('ChatbotWidget: localStorage access_token:', localStorage.getItem('access_token'));
            console.log('ChatbotWidget: localStorage token:', localStorage.getItem('token'));
        }
    }, [userId, isLoggedIn, getToken]);

    // Debug: Log when component first mounts
    useEffect(() => {
        console.log('ChatbotWidget: Component mounted');
        console.log('ChatbotWidget: Initial userId:', userId);
        console.log('ChatbotWidget: Initial isLoggedIn:', isLoggedIn);
        console.log('ChatbotWidget: Auth context available:', !!useAuth);
    }, []);

    // Debug: Log context changes
    useEffect(() => {
        console.log('ChatbotWidget: Context changed:', {
            projectId,
            projectName,
            sessionId,
            sessionName,
            isProjectPage,
            isSessionPage
        });

        // Additional debugging for routing
        if (typeof window !== 'undefined') {
            console.log('ChatbotWidget: Current URL:', window.location.href);
            console.log('ChatbotWidget: Current pathname:', window.location.pathname);
            console.log('ChatbotWidget: URL includes /projects:', window.location.pathname.includes('/projects'));
            console.log('ChatbotWidget: URL includes /sessions:', window.location.pathname.includes('/sessions'));
        }

        // Mark context as loaded when we have the necessary information
        if (isProjectPage && projectId) {
            setContextLoaded(true);
            console.log('ChatbotWidget: Project context loaded:', { projectId, projectName });
        } else if (isSessionPage && sessionId) {
            setContextLoaded(true);
            console.log('ChatbotWidget: Session context loaded:', { sessionId, sessionName });
        } else if (!isProjectPage && !isSessionPage) {
            setContextLoaded(true);
            console.log('ChatbotWidget: General context loaded');
        }
    }, [projectId, projectName, sessionId, sessionName, isProjectPage, isSessionPage]);

    const handleOpenChat = async () => {
        // Check authentication before opening chat
        if (!isLoggedIn || !userId) {
            console.error('ChatbotWidget: Cannot open chat - user not authenticated');
            // Show authentication error message
            setMessages([{
                id: '1',
                message: 'Please log in to use the chatbot. You can log in using the login button in the header.',
                sender: 'bot',
                timestamp: new Date(),
                status: 'error'
            }]);
            return;
        }

        setIsOpen(true);
        setUnreadCount(0);

        // Load chat history if we have a session
        if (currentSession && userId) {
            try {
                const history = await chatService.getChatHistory(currentSession.id);
                if (history.length > 0) {
                    setMessages(history);
                }
            } catch (error) {
                console.error('Error loading chat history:', error);
            }
        }
    };

    const handleCloseChat = () => {
        setIsOpen(false);
    };

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) {
            console.error('ChatbotWidget: Empty message');
            return;
        }

        // Enhanced authentication check
        if (!isLoggedIn || !userId) {
            console.error('ChatbotWidget: No userId available or user not logged in');
            console.error('ChatbotWidget: isLoggedIn:', isLoggedIn);
            console.error('ChatbotWidget: userId:', userId);
            console.error('ChatbotWidget: token:', getToken());

            // Add error message to chat
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                message: 'Please log in to use the chatbot. You can log in using the login button in the header.',
                sender: 'bot',
                timestamp: new Date(),
                status: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        // Check if context is loaded
        if (!contextLoaded) {
            console.error('ChatbotWidget: Context not yet loaded');
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                message: 'Please wait a moment while I load the project context...',
                sender: 'bot',
                timestamp: new Date(),
                status: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        console.log('ChatbotWidget: Sending message:', JSON.stringify({
            message: message.trim(),
            userId,
            projectId,
            sessionId: currentSession?.id,
            isProjectPage
        }, null, 2));

        // Add user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            message: message.trim(),
            sender: 'user',
            timestamp: new Date(),
            status: 'sending'
        };

        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        try {
            // Send message to backend
            const messageRequest = {
                message: message.trim(),
                userId,
                sessionId: isSessionPage ? sessionId : currentSession?.id,
                projectId: isProjectPage ? projectId : currentSession?.projectId,
                chatSessionId: currentSession?.id,
            };

            console.log('ChatbotWidget: Sending message request:', messageRequest);
            console.log('ChatbotWidget: Context detection:', {
                isSessionPage,
                isProjectPage,
                sessionId,
                projectId,
                currentSessionId: currentSession?.id,
                currentProjectId: currentSession?.projectId
            });
            console.log('ChatbotWidget: Final projectId being sent:', messageRequest.projectId);

            const response = await chatService.sendMessage(messageRequest);

            console.log('ChatbotWidget: Backend response:', response);

            // Update user message status
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === userMessage.id
                        ? { ...msg, status: 'sent' as const }
                        : msg
                )
            );

            // Add bot response
            const botMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                message: response.response,
                sender: 'bot',
                timestamp: new Date(),
                status: 'sent'
            };

            setMessages(prev => [...prev, botMessage]);

            // Update session with the real backend session ID
            if (response.sessionId) {
                const session: ChatSession = {
                    id: response.sessionId,
                    projectId: projectId || 'general',
                    userId: userId,
                    title: projectId ? 'Project Chat' : 'General Chat',
                    status: 'active' as const,
                    createdAt: new Date(),
                };
                setCurrentSession(session);
            }

            setIsTyping(false);
        } catch (error) {
            console.error('ChatbotWidget: Error sending message:', error);
            setIsTyping(false);

            // Update user message status to error
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === userMessage.id
                        ? { ...msg, status: 'error' as const }
                        : msg
                )
            );

            // Add error message with retry option
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                message: 'I\'m having trouble processing your question. This might be due to missing project context or a temporary issue. Please try rephrasing your question or try again in a moment.',
                sender: 'bot',
                timestamp: new Date(),
                status: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const getPositionStyles = () => {
        switch (position) {
            case 'bottom-left':
                return { bottom: 20, left: 20 };
            case 'top-right':
                return { top: 20, right: 20 };
            case 'top-left':
                return { top: 20, left: 20 };
            default: // bottom-right
                return { bottom: 20, right: 20 };
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <Box
                sx={{
                    position: 'fixed',
                    zIndex: 1000,
                    ...getPositionStyles(),
                }}
            >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                    <Fab
                        color={isLoggedIn ? "primary" : "secondary"}
                        aria-label="chat"
                        onClick={handleOpenChat}
                        sx={{
                            width: 60,
                            height: 60,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0 6px 25px rgba(0,0,0,0.2)',
                            },
                            transition: 'all 0.2s ease-in-out',
                            opacity: isLoggedIn ? 1 : 0.7,
                        }}
                        title={isLoggedIn ? "Chat with AI Assistant" : "Please log in to use the chatbot"}
                    >
                        <BotIcon sx={{ fontSize: 28 }} />
                    </Fab>
                </Badge>
            </Box>

            {/* Chat Dialog */}
            <Dialog
                open={isOpen}
                onClose={handleCloseChat}
                TransitionComponent={Transition}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        height: '600px',
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }
                }}
            >
                {/* Chat Header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isLoggedIn ? 'primary.main' : 'warning.main',
                        color: 'white',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BotIcon />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {!isLoggedIn ? 'Authentication Required' :
                                isSessionPage ? `${sessionName || 'Session'} AI` :
                                    isProjectPage ? `${projectName || 'Project'} AI` : 'AI Assistant'}
                        </Typography>
                        {!isLoggedIn && (
                            <Typography variant="caption" sx={{ opacity: 0.8, ml: 1 }}>
                                Please log in to continue
                            </Typography>
                        )}
                        {isLoggedIn && (
                            <Typography variant="caption" sx={{ opacity: 0.8, ml: 1, color: 'success.light' }}>
                                ✓ Authenticated
                            </Typography>
                        )}
                        {!isLoggedIn && (
                            <IconButton
                                size="small"
                                onClick={async () => {
                                    try {
                                        const { verifyToken } = useAuth();
                                        const isValid = await verifyToken();
                                        if (isValid) {
                                            console.log('ChatbotWidget: Token verification successful');
                                        } else {
                                            console.log('ChatbotWidget: Token verification failed');
                                        }
                                    } catch (error) {
                                        console.error('ChatbotWidget: Error verifying token:', error);
                                    }
                                }}
                                sx={{
                                    color: 'white',
                                    opacity: 0.8,
                                    '&:hover': { opacity: 1 }
                                }}
                                title="Refresh authentication status"
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        )}
                        {isSessionPage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    Session Context
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={async () => {
                                        if (sessionId) {
                                            try {
                                                const response = await fetch(`https://api.hellopogo.com/api/chat/vectorize-session/${sessionId}`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                                    }
                                                });
                                                if (response.ok) {
                                                    alert('Session data vectorized successfully! The chatbot can now provide specific session information.');
                                                } else {
                                                    alert('Failed to vectorize session data. Please try again.');
                                                }
                                            } catch (error) {
                                                console.error('Error vectorizing session:', error);
                                                alert('Error vectorizing session data.');
                                            }
                                        }
                                    }}
                                    sx={{
                                        color: 'white',
                                        opacity: 0.8,
                                        '&:hover': { opacity: 1 }
                                    }}
                                    title="Vectorize session data for better AI responses"
                                >
                                    <BotIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}
                        {isProjectPage && !isSessionPage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    Project Context
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={async () => {
                                        if (projectId) {
                                            try {
                                                const response = await fetch(`https://api.hellopogo.com/api/chat/vectorize-project/${projectId}`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                                    }
                                                });
                                                if (response.ok) {
                                                    alert('Project data vectorized successfully! The chatbot can now provide specific project information.');
                                                } else {
                                                    alert('Failed to vectorize project data. Please try again.');
                                                }
                                            } catch (error) {
                                                console.error('Error vectorizing project:', error);
                                                alert('Error vectorizing project data.');
                                            }
                                        }
                                    }}
                                    sx={{
                                        color: 'white',
                                        opacity: 0.8,
                                        '&:hover': { opacity: 1 }
                                    }}
                                    title="Vectorize project data for better AI responses"
                                >
                                    <SmartToy fontSize="small" />
                                </IconButton>
                            </Box>
                        )}
                    </Box>
                    <IconButton
                        onClick={handleCloseChat}
                        sx={{ color: 'white' }}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Chat Content */}
                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                    {!isLoggedIn ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            p: 4,
                            textAlign: 'center'
                        }}>
                            <BotIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Authentication Required
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Please log in to use the chatbot. You can ask questions about your projects, sessions, and artifacts.
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Use the login button in the header to authenticate
                            </Typography>
                        </Box>
                    ) : !contextLoaded ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            p: 4,
                            textAlign: 'center'
                        }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Loading Project Context...
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Please wait while I gather information about your current project.
                            </Typography>
                        </Box>
                    ) : (
                        <ChatInterface
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isTyping={isTyping}
                            messagesEndRef={messagesEndRef}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
} 