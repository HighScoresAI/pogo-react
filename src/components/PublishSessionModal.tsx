import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    Checkbox,
    IconButton,
} from '@mui/material';
import {
    Close as CloseIcon,
    SmartToy as ChatbotIcon,
    Article as BlogIcon,
} from '@mui/icons-material';

interface PublishSessionModalProps {
    open: boolean;
    onClose: () => void;
    onPublish: (options: { chatbot: boolean; blog: boolean }) => void;
    loading?: boolean;
}

export default function PublishSessionModal({
    open,
    onClose,
    onPublish,
    loading = false,
}: PublishSessionModalProps) {
    const [selectedOptions, setSelectedOptions] = useState({
        chatbot: true,
        blog: false,
    });

    const handleOptionToggle = (option: 'chatbot' | 'blog') => {
        setSelectedOptions(prev => ({
            ...prev,
            [option]: !prev[option],
        }));
    };

    const handlePublish = () => {
        onPublish(selectedOptions);
    };

    const handleClose = () => {
        setSelectedOptions({ chatbot: true, blog: false });
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    bgcolor: 'white',
                    color: 'black',
                    width: '776px',
                    maxWidth: '776px',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1,
                    pr: 1,
                    color: 'black',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                }}
            >
                Publish Session
                <IconButton
                    onClick={handleClose}
                    sx={{
                        color: 'black',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.1)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pb: 2 }}>
                <Typography
                    sx={{
                        color: '#242426',
                        fontSize: '20px',
                        mb: 3,
                        fontFamily: 'Inter',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        lineHeight: 'normal',
                        whiteSpace: 'nowrap',
                        '& .highlight': {
                            color: '#7C7C80',
                            fontSize: '16px',
                            fontFamily: 'Inter',
                            fontStyle: 'normal',
                            fontWeight: 500,
                            lineHeight: 'normal',
                        },
                    }}
                >
                    Choose how you want to share this session with others. <span className="highlight">(you can select both)</span>
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Chatbot Option */}
                    <Card
                        sx={{
                            bgcolor: selectedOptions.chatbot ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            border: selectedOptions.chatbot ? '2px solid #60A5FA' : '2px solid transparent',
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: selectedOptions.chatbot ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                            },
                        }}
                        onClick={() => handleOptionToggle('chatbot')}
                    >
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                <ChatbotIcon
                                    sx={{
                                        color: selectedOptions.chatbot ? '#60A5FA' : '#888888',
                                        fontSize: 28,
                                    }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        sx={{
                                            color: 'black',
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            mb: 0.5,
                                        }}
                                    >
                                        Publish to Chatbot
                                    </Typography>
                                    <Typography
                                        sx={{
                                            color: '#666666',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        Turn this session into an interactive step-by-step guide powered by Hello Pogo smart assistant. Perfect for onboarding, product help, or team knowledge sharing.
                                    </Typography>
                                </Box>
                            </Box>
                            <Checkbox
                                checked={selectedOptions.chatbot}
                                sx={{
                                    color: '#60A5FA',
                                    '&.Mui-checked': {
                                        color: '#60A5FA',
                                    },
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Blog Option */}
                    <Card
                        sx={{
                            bgcolor: selectedOptions.blog ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            border: selectedOptions.blog ? '2px solid #60A5FA' : '2px solid transparent',
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: selectedOptions.blog ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                            },
                        }}
                        onClick={() => handleOptionToggle('blog')}
                    >
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                <BlogIcon
                                    sx={{
                                        color: selectedOptions.blog ? '#60A5FA' : '#888888',
                                        fontSize: 28,
                                    }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        sx={{
                                            color: 'black',
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            mb: 0.5,
                                        }}
                                    >
                                        Publish to Blog
                                    </Typography>
                                    <Typography
                                        sx={{
                                            color: '#666666',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        Convert this session into a well-formatted blog post. Great for documentation, marketing, or SEO. Customize title, intro and tags before publishing.
                                    </Typography>
                                </Box>
                            </Box>
                            <Checkbox
                                checked={selectedOptions.blog}
                                sx={{
                                    color: '#60A5FA',
                                    '&.Mui-checked': {
                                        color: '#60A5FA',
                                    },
                                }}
                            />
                        </CardContent>
                    </Card>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button
                    onClick={handleClose}
                    sx={{
                        bgcolor: '#f5f5f5',
                        color: 'black',
                        border: '1px solid #4CAF50',
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        '&:hover': {
                            bgcolor: '#e8e8e8',
                        },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handlePublish}
                    disabled={loading || (!selectedOptions.chatbot && !selectedOptions.blog)}
                    sx={{
                        bgcolor: '#4CAF50',
                        color: 'white',
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        '&:hover': {
                            bgcolor: '#45a049',
                        },
                        '&:disabled': {
                            bgcolor: '#666666',
                            color: '#999999',
                        },
                    }}
                >
                    {loading ? 'Publishing...' : 'Publish'}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 