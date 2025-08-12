'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Divider,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Paper,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPost {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    status: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    session_id: string;
    project_id: string;
    word_doc_path?: string;
    seo_title?: string;
    seo_description?: string;
    author_id: string;
}

export default function BlogPostViewPage() {
    const params = useParams();
    const router = useRouter();
    const { userId, isLoggedIn } = useAuth();
    const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const blogId = params.blogId as string;

    useEffect(() => {
        if (blogId && isLoggedIn && userId) {
            loadBlogPost();
        }
    }, [blogId, userId, isLoggedIn]);

    const loadBlogPost = async () => {
        try {
            setLoading(true);
            const response = await ApiClient.getBlogPost(blogId);
            setBlogPost(response);
            setError(null);
        } catch (err) {
            console.error('Error loading blog post:', err);
            setError('Failed to load blog post');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadWordDoc = async () => {
        if (!blogPost) return;

        try {
            const blob = await ApiClient.downloadBlogWordDoc(blogPost.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `blog_${blogPost.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Error downloading Word document:', err);
            setError('Failed to download Word document');
        }
    };

    const handleRegenerateBlogPost = async () => {
        if (!blogPost) return;

        try {
            await ApiClient.regenerateBlogPost(blogPost.id);
            loadBlogPost(); // Reload to get updated content
        } catch (err) {
            console.error('Error regenerating blog post:', err);
            setError('Failed to regenerate blog post');
        }
    };

    const handleDeleteBlogPost = async () => {
        if (!blogPost || !confirm('Are you sure you want to delete this blog post?')) return;

        try {
            await ApiClient.deleteBlogPost(blogPost.id);
            router.push('/blog');
        } catch (err) {
            console.error('Error deleting blog post:', err);
            setError('Failed to delete blog post');
        }
    };

    const handleEditBlogPost = () => {
        router.push(`/blog/${blogId}/edit`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'success';
            case 'review':
                return 'warning';
            case 'draft':
            default:
                return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !blogPost) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || 'Blog post not found'}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/blog')}
                >
                    Back to Blog Dashboard
                </Button>
            </Box>
        );
    }

    const isOwner = userId && blogPost.author_id === userId;

    return (
        <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/blog')}
                    sx={{ color: '#666' }}
                >
                    Back to Blog Dashboard
                </Button>

                {isOwner && (
                    <Box display="flex" gap={1}>
                        <Tooltip title="Edit Blog Post">
                            <IconButton onClick={handleEditBlogPost} color="primary">
                                <EditIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Download Word Document">
                            <IconButton
                                onClick={handleDownloadWordDoc}
                                disabled={!blogPost.word_doc_path}
                                color="primary"
                            >
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Regenerate Content">
                            <IconButton onClick={handleRegenerateBlogPost} color="primary">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Blog Post">
                            <IconButton onClick={handleDeleteBlogPost} color="error">
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            {/* Blog Post Content */}
            <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
                {/* Title and Meta */}
                <Box mb={3}>
                    <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                        {blogPost.title}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Chip
                            label={blogPost.status}
                            color={getStatusColor(blogPost.status) as any}
                            size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                            Created: {formatDate(blogPost.created_at)}
                        </Typography>
                        {blogPost.updated_at !== blogPost.created_at && (
                            <Typography variant="body2" color="text.secondary">
                                • Updated: {formatDate(blogPost.updated_at)}
                            </Typography>
                        )}
                    </Box>

                    {blogPost.excerpt && (
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            sx={{ fontStyle: 'italic', mb: 2 }}
                        >
                            {blogPost.excerpt}
                        </Typography>
                    )}

                    {blogPost.tags.length > 0 && (
                        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                            {blogPost.tags.map((tag, index) => (
                                <Chip key={index} label={tag} size="small" variant="outlined" />
                            ))}
                        </Box>
                    )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Main Content */}
                <Box>
                    <Typography
                        variant="body1"
                        component="div"
                        sx={{
                            lineHeight: 1.8,
                            fontSize: '1.1rem',
                            '& p': { mb: 2 },
                            '& h2': {
                                fontSize: '1.8rem',
                                fontWeight: 600,
                                mt: 4,
                                mb: 2,
                                color: '#333'
                            },
                            '& h3': {
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                mt: 3,
                                mb: 2,
                                color: '#444'
                            },
                            '& ul, & ol': {
                                mb: 2,
                                pl: 3
                            },
                            '& li': {
                                mb: 1
                            },
                            '& blockquote': {
                                borderLeft: '4px solid #ddd',
                                pl: 2,
                                ml: 0,
                                fontStyle: 'italic',
                                color: '#666'
                            },
                            '& code': {
                                bgcolor: '#f5f5f5',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontFamily: 'monospace'
                            },
                            '& pre': {
                                bgcolor: '#f5f5f5',
                                p: 2,
                                borderRadius: 1,
                                overflow: 'auto'
                            }
                        }}
                        dangerouslySetInnerHTML={{ __html: blogPost.content }}
                    />
                </Box>
            </Paper>

            {/* SEO Information (if available) */}
            {(blogPost.seo_title || blogPost.seo_description) && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            SEO Information
                        </Typography>
                        {blogPost.seo_title && (
                            <Box mb={2}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    SEO Title:
                                </Typography>
                                <Typography variant="body2">
                                    {blogPost.seo_title}
                                </Typography>
                            </Box>
                        )}
                        {blogPost.seo_description && (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    SEO Description:
                                </Typography>
                                <Typography variant="body2">
                                    {blogPost.seo_description}
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Session Information */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Session Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        This blog post was generated from session: {blogPost.session_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Project ID: {blogPost.project_id}
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
