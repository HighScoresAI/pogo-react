'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    IconButton,
    TextField,
    Typography,
    Avatar,
    Fab,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Divider,
    CircularProgress,
    Alert,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    Chat as ChatIcon,
    Send as SendIcon,
    Close as CloseIcon,
    SmartToy as BotIcon,
    Person as PersonIcon,
    ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { ApiClient } from '../lib/api';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

interface ChatbotWidgetProps {
    projectId?: string;
    userId?: string;
    title?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export default function ChatbotWidget({
    projectId = 'default',
    userId = 'anonymous',
    title = 'HelloPogo Assistant',
    position = 'bottom-right'
}: ChatbotWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            content: 'Hello! I\'m your HelloPogo assistant. How can I help you today?',
            role: 'assistant',
            timestamp: new Date(),
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedProject, setSelectedProject] = useState<{ projectId: string; projectName: string } | null>(null);

    // Hardcoded list of button labels in the web app
    const buttonLabels = [
        'Create Project',
        'Process All',
        'Edit',
        'Vectorize',
        'Login',
        'Register',
        'Delete',
        'View',
        'Save',
        'Cancel',
        'Copy Text',
        'Download',
        'Open in Document Editor',
        'Manage Members',
        'Choose Plan',
        'Contact Sales',
        'Sign in with Google',
        'Sign In',
        'Create Account',
        'Send Message',
    ];
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [projects, setProjects] = useState<{ projectId: string; projectName: string }[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const handleDropdownClick = async (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        if (projects.length === 0 && !projectsLoading) {
            setProjectsLoading(true);
            try {
                const res = await ApiClient.get<any[]>('/projects');
                setProjects(res.map((p: any) => ({ projectId: p.projectId, projectName: p.projectName })));
            } catch {
                setProjects([]);
            } finally {
                setProjectsLoading(false);
            }
        }
    };
    const handleDropdownClose = () => {
        setAnchorEl(null);
    };
    const handleProjectSelect = (project: { projectId: string; projectName: string }) => {
        setSelectedProject(project);
        setInputMessage(project.projectName);
        setAnchorEl(null);
    };
    const handleButtonSelect = (label: string) => {
        setInputMessage(label);
        setAnchorEl(null);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage.trim(),
            role: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setError(null);

        try {
            let response;
            if (selectedProject) {
                response = await ApiClient.sendChatMessage(
                    selectedProject.projectId,
                    userMessage.content,
                    userId,
                    sessionId
                );
            } else {
                response = await ApiClient.sendGeneralMessage(
                    userMessage.content,
                    userId,
                    sessionId
                );
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: (response as any).response,
                role: 'assistant',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Store session ID for future messages
            if ((response as any).sessionId && !sessionId) {
                setSessionId((response as any).sessionId);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
            console.error('Chat error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
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
            default:
                return { bottom: 20, right: 20 };
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Floating Action Button */}
            <Fab
                color="primary"
                aria-label="chat"
                onClick={() => setIsOpen(true)}
                sx={{
                    position: 'fixed',
                    ...getPositionStyles(),
                    zIndex: 1000,
                    display: isOpen ? 'none' : 'flex',
                }}
            >
                <ChatIcon />
            </Fab>

            {/* Chat Drawer */}
            <Drawer
                anchor="right"
                open={isOpen}
                onClose={() => setIsOpen(false)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 400 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: 'primary.main',
                        color: 'white',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BotIcon />
                        <Typography variant="h6">{title}</Typography>
                    </Box>
                    <IconButton
                        color="inherit"
                        onClick={() => setIsOpen(false)}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Messages */}
                <Box
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {messages.map((message) => (
                        <Box
                            key={message.id}
                            sx={{
                                display: 'flex',
                                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                                mb: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    maxWidth: '80%',
                                }}
                            >
                                {message.role === 'assistant' && (
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                        <BotIcon fontSize="small" />
                                    </Avatar>
                                )}
                                <Paper
                                    sx={{
                                        p: 1.5,
                                        bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                                        color: message.role === 'user' ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    <Typography variant="body2">{message.content}</Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            mt: 0.5,
                                            opacity: 0.7,
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        {formatTime(message.timestamp)}
                                    </Typography>
                                </Paper>
                                {message.role === 'user' && (
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                        <PersonIcon fontSize="small" />
                                    </Avatar>
                                )}
                            </Box>
                        </Box>
                    ))}

                    {isLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    <BotIcon fontSize="small" />
                                </Avatar>
                                <Paper sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 2 }}>
                                    <CircularProgress size={16} />
                                </Paper>
                            </Box>
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {error}
                        </Alert>
                    )}

                    <div ref={messagesEndRef} />
                </Box>

                {/* Input */}
                <Box
                    sx={{
                        p: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    {/* Dropdown above input */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <IconButton onClick={handleDropdownClick} size="small" color="primary">
                            <ArrowDropDownIcon />
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleDropdownClose}>
                            {projectsLoading ? (
                                <MenuItem disabled>Loading...</MenuItem>
                            ) : projects.length === 0 ? (
                                <MenuItem disabled>No projects found</MenuItem>
                            ) : (
                                projects.map((proj) => (
                                    <MenuItem key={proj.projectId} onClick={() => handleProjectSelect(proj)}>{proj.projectName}</MenuItem>
                                ))
                            )}
                        </Menu>
                        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                            Insert project name
                        </Typography>
                    </Box>
                    {selectedProject && (
                        <Box sx={{ mb: 1, ml: 1 }}>
                            <Typography variant="caption" color="primary.main">
                                Selected Project: {selectedProject.projectName}
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            ref={inputRef}
                            fullWidth
                            size="small"
                            placeholder="Type your message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            multiline
                            maxRows={3}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                },
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            sx={{ alignSelf: 'flex-end' }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
} 