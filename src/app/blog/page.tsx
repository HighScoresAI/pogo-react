'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    status: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    session_id: string;
    project_id: string;
    word_doc_path?: string;
}

export default function BlogDashboardPage() {
    const { userId, isLoggedIn } = useAuth();
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

    useEffect(() => {
        console.log('Blog page useEffect - userId:', userId, 'isLoggedIn:', isLoggedIn);
        if (isLoggedIn && userId) {
            loadBlogPosts();
        } else {
            console.log('No user found, setting loading to false');
            setLoading(false);
        }
    }, [userId, isLoggedIn]);

    const loadBlogPosts = async () => {
        try {
            console.log('Loading blog posts...');
            setLoading(true);

            // Add timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );

            const responsePromise = ApiClient.getBlogPosts();
            const response = await Promise.race([responsePromise, timeoutPromise]);

            console.log('Blog posts response:', response);
            setBlogPosts(response.blog_posts || []);
            setError(null);
        } catch (err) {
            console.error('Error loading blog posts:', err);
            setError(`Failed to load blog posts: ${err.message || err}`);
        } finally {
            console.log('Setting loading to false');
            setLoading(false);
        }
    };



    const handleEditBlogPost = async (postId: string, updates: Partial<BlogPost>) => {
        try {
            await ApiClient.updateBlogPost(postId, updates);
            setEditDialogOpen(false);
            setSelectedPost(null);
            loadBlogPosts();
        } catch (err) {
            console.error('Error updating blog post:', err);
            setError('Failed to update blog post');
        }
    };

    const handleDeleteBlogPost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;

        try {
            await ApiClient.deleteBlogPost(postId);
            loadBlogPosts();
        } catch (err) {
            console.error('Error deleting blog post:', err);
            setError('Failed to delete blog post');
        }
    };

    const handleDownloadWordDoc = async (postId: string) => {
        try {
            const blob = await ApiClient.downloadBlogWordDoc(postId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `blog_post_${postId}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Error downloading Word document:', err);
            setError('Failed to download Word document');
        }
    };

    const handleRegenerateBlogPost = async (postId: string) => {
        try {
            await ApiClient.regenerateBlogPost(postId);
            loadBlogPosts();
        } catch (err) {
            console.error('Error regenerating blog post:', err);
            setError('Failed to regenerate blog post');
        }
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
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isLoggedIn || !userId) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Please log in to access the blog dashboard
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => window.location.href = '/login'}
                    sx={{ mt: 2 }}
                >
                    Go to Login
                </Button>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Loading blog posts...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Blog Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Blog posts are automatically created when you publish sessions with "Publish to Blog" enabled
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Blog Posts Grid */}
            <Grid container spacing={3}>
                {blogPosts.length === 0 ? (
                    <Grid xs={12}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No blog posts yet
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Blog posts are automatically created when you publish sessions with "Publish to Blog" enabled
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ) : (
                    blogPosts.map((post) => (
                        <Grid xs={12} md={6} lg={4} key={post.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Typography
                                            variant="h6"
                                            component="h2"
                                            fontWeight="600"
                                            sx={{
                                                flex: 1,
                                                mr: 1,
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline', color: '#1976d2' }
                                            }}
                                            onClick={() => window.open(`/blog/${post.id}`, '_blank')}
                                        >
                                            {post.title}
                                        </Typography>
                                        <Chip
                                            label={post.status}
                                            color={getStatusColor(post.status) as any}
                                            size="small"
                                        />
                                    </Box>

                                    {post.excerpt && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {post.excerpt}
                                        </Typography>
                                    )}

                                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                                        {post.tags.map((tag, index) => (
                                            <Chip key={index} label={tag} size="small" variant="outlined" />
                                        ))}
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">
                                        Created: {formatDate(post.created_at)}
                                    </Typography>
                                    {post.updated_at !== post.created_at && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Updated: {formatDate(post.updated_at)}
                                        </Typography>
                                    )}
                                </CardContent>

                                <CardActions sx={{ pt: 0 }}>
                                    <Tooltip title="View Full Post">
                                        <IconButton
                                            size="small"
                                            onClick={() => window.open(`/blog/${post.id}`, '_blank')}
                                            color="primary"
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedPost(post);
                                                setEditDialogOpen(true);
                                            }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Download Word Document">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDownloadWordDoc(post.id)}
                                            disabled={!post.word_doc_path}
                                        >
                                            <DownloadIcon />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Regenerate Content">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRegenerateBlogPost(post.id)}
                                        >
                                            <RefreshIcon />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Delete">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteBlogPost(post.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>



            {/* Edit Blog Post Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Blog Post</DialogTitle>
                <DialogContent>
                    {selectedPost && (
                        <>
                            <TextField
                                fullWidth
                                label="Title"
                                value={selectedPost.title}
                                onChange={(e) => setSelectedPost({ ...selectedPost, title: e.target.value })}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Excerpt"
                                value={selectedPost.excerpt}
                                onChange={(e) => setSelectedPost({ ...selectedPost, excerpt: e.target.value })}
                                margin="normal"
                                multiline
                                rows={3}
                            />
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={selectedPost.status}
                                    onChange={(e) => setSelectedPost({ ...selectedPost, status: e.target.value })}
                                    label="Status"
                                >
                                    <MenuItem value="draft">Draft</MenuItem>
                                    <MenuItem value="review">Review</MenuItem>
                                    <MenuItem value="published">Published</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="Tags"
                                value={selectedPost.tags.join(', ')}
                                onChange={(e) => setSelectedPost({
                                    ...selectedPost,
                                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                                })}
                                margin="normal"
                                helperText="Comma-separated tags"
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => selectedPost && handleEditBlogPost(selectedPost.id, {
                            title: selectedPost.title,
                            excerpt: selectedPost.excerpt,
                            status: selectedPost.status,
                            tags: selectedPost.tags,
                        })}
                        variant="contained"
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
