'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Typography,
    Avatar,
    Paper,
    CircularProgress,
    Fade,
    Zoom,
} from '@mui/material';
import {
    Send as SendIcon,
    SmartToy as BotIcon,
    Person as PersonIcon,
    EmojiEmotions as EmojiIcon,
    AttachFile as AttachFileIcon,
} from '@mui/icons-material';

// Types
interface ChatMessage {
    id: string;
    message: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    status?: 'sending' | 'sent' | 'delivered' | 'error';
}

interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isTyping: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function ChatInterface({
    messages,
    onSendMessage,
    isTyping,
    messagesEndRef,
}: ChatInterfaceProps) {
    const [inputMessage, setInputMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMessage.trim() && !isTyping) {
            onSendMessage(inputMessage);
            setInputMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as any);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // TODO: Handle file upload
            console.log('File selected:', file.name);
            // You can add file handling logic here
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getMessageStatus = (status?: string) => {
        switch (status) {
            case 'sending':
                return <CircularProgress size={12} />;
            case 'sent':
                return <Typography variant="caption" color="text.secondary">✓</Typography>;
            case 'delivered':
                return <Typography variant="caption" color="text.secondary">✓✓</Typography>;
            case 'error':
                return <Typography variant="caption" color="error">✗</Typography>;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Messages Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    bgcolor: 'grey.50',
                }}
            >
                {messages.map((message) => (
                    <Fade key={message.id} in={true} timeout={300}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                mb: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: 1,
                                    maxWidth: '70%',
                                }}
                            >
                                {message.sender === 'bot' && (
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: 'primary.main',
                                        }}
                                    >
                                        <BotIcon fontSize="small" />
                                    </Avatar>
                                )}

                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        bgcolor: message.sender === 'user' ? 'primary.main' : 'white',
                                        color: message.sender === 'user' ? 'white' : 'text.primary',
                                        position: 'relative',
                                        maxWidth: '100%',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        {message.message}
                                    </Typography>

                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            justifyContent: 'flex-end',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                                                fontSize: '0.7rem',
                                            }}
                                        >
                                            {formatTime(message.timestamp)}
                                        </Typography>
                                        {message.sender === 'user' && getMessageStatus(message.status)}
                                    </Box>
                                </Paper>

                                {message.sender === 'user' && (
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: 'secondary.main',
                                        }}
                                    >
                                        <PersonIcon fontSize="small" />
                                    </Avatar>
                                )}
                            </Box>
                        </Box>
                    </Fade>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <Fade in={true} timeout={300}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                mb: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: 1,
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: 'primary.main',
                                    }}
                                >
                                    <BotIcon fontSize="small" />
                                </Avatar>

                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        bgcolor: 'white',
                                        minWidth: 80,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                        <CircularProgress size={16} />
                                        <Typography variant="body2" color="text.secondary">
                                            Typing...
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    {/* File Upload */}
                    <IconButton
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ color: 'text.secondary' }}
                    >
                        <AttachFileIcon />
                    </IconButton>
                    <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />

                    {/* Emoji Picker Toggle */}
                    <IconButton
                        size="small"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        sx={{ color: 'text.secondary' }}
                    >
                        <EmojiIcon />
                    </IconButton>

                    {/* Message Input */}
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Type a message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isTyping}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                bgcolor: 'grey.50',
                            },
                        }}
                    />

                    {/* Send Button */}
                    <IconButton
                        type="submit"
                        color="primary"
                        disabled={!inputMessage.trim() || isTyping}
                        sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            },
                            '&:disabled': {
                                bgcolor: 'grey.300',
                                color: 'grey.500',
                            },
                        }}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <Fade in={showEmojiPicker} timeout={200}>
                        <Paper
                            elevation={3}
                            sx={{
                                mt: 1,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'grey.100',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Emoji picker placeholder - you can integrate a real emoji picker library here
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {['😊', '👍', '❤️', '🎉', '🔥', '💡', '🚀', '✨'].map((emoji) => (
                                    <IconButton
                                        key={emoji}
                                        size="small"
                                        onClick={() => {
                                            setInputMessage(prev => prev + emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                        sx={{ fontSize: '1.2rem' }}
                                    >
                                        {emoji}
                                    </IconButton>
                                ))}
                            </Box>
                        </Paper>
                    </Fade>
                )}
            </Box>
        </Box>
    );
} 