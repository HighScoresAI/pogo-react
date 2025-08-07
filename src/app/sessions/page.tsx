'use client';

import React, { useState, useEffect, Suspense } from 'react';

// Prevent prerendering for this page
export const dynamic = 'force-dynamic';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Visibility,
    Refresh,
    Upload,
    Delete,
    Edit,
    PersonAdd,
    PlayArrow,
    Pause,
    Stop,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient } from '../../lib/api';

interface Session {
    _id: string;
    description: string;
    status: string;
    duration?: string;
    artifacts: Array<{ _id?: string; captureType?: string }>;
    createdAt: string;
    bgClass: string;
    iconClass: string;
    badgeClass: string;
}

interface ProjectUser {
    name: string;
    email: string;
    role: string;
}

function SessionsContent() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [projectName, setProjectName] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedSessionIndex, setSelectedSessionIndex] = useState<number | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showProcessDialog, setShowProcessDialog] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [showRemoveUserDialog, setShowRemoveUserDialog] = useState(false);
    const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '' });

    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('project');

    const mockProjectUsers: ProjectUser[] = [
        { name: 'John Doe', email: 'john@example.com', role: 'Owner' },
        { name: 'Jane Smith', email: 'jane@example.com', role: 'Editor' },
        { name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer' },
    ];

    useEffect(() => {
        loadSessions();
        if (projectId) {
            setProjectName('E-commerce Platform'); // Mock project name
            setProjectUsers(mockProjectUsers);
        }
    }, [projectId]);

    const loadSessions = async () => {
        try {
            setIsLoading(true);
            let endpoint = '/sessions/';
            if (projectId) {
                endpoint = `/sessions/project/${projectId}`;
            }
            const response = await ApiClient.get<Session[]>(endpoint);
            setSessions(response);
        } catch (error) {
            console.error('Error loading sessions:', error);
            setError('Failed to load sessions');
        } finally {
            setIsLoading(false);
        }
    };



    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedSessionIndex(null);
    };

    const handleMenuAction = (action: string) => {
        if (selectedSessionIndex === null) return;

        const session = sessions[selectedSessionIndex];

        switch (action) {
            case 'view':
                router.push(`/sessions/${session._id}`);
                break;
            case 'edit':
                setEditForm({
                    name: session.description,
                    description: session.description,
                });
                setShowEditDialog(true);
                break;
            case 'process':
                setShowProcessDialog(true);
                break;
            case 'publish':
                setShowPublishDialog(true);
                break;
            case 'users':
                setShowUserDialog(true);
                break;
            case 'delete':
                setShowDeleteDialog(true);
                break;
        }

        handleMenuClose();
    };

    const handleEditConfirm = async () => {
        if (selectedSessionIndex === null) return;

        try {
            const sessionId = sessions[selectedSessionIndex]._id;
            await ApiClient.put(`/sessions/${sessionId}`, editForm);
            const updatedSessions = [...sessions];
            updatedSessions[selectedSessionIndex] = {
                ...updatedSessions[selectedSessionIndex],
                description: editForm.name,
            };
            setSessions(updatedSessions);
            setShowEditDialog(false);
        } catch (error) {
            console.error('Error updating session:', error);
            setError('Failed to update session');
        }
    };

    const handleProcessConfirm = async () => {
        if (selectedSessionIndex === null) return;

        try {
            const sessionId = sessions[selectedSessionIndex]._id;
            await ApiClient.post(`/sessions/${sessionId}/process`, {});
            setShowProcessDialog(false);
            // Show success message (optional)
        } catch (error) {
            console.error('Error processing session:', error);
            setError('Failed to process session');
        }
    };

    const handlePublishConfirm = async () => {
        if (selectedSessionIndex === null) return;

        try {
            const sessionId = sessions[selectedSessionIndex]._id;
            await ApiClient.post(`/sessions/${sessionId}/publish`, {});
            setShowPublishDialog(false);
            // Show success message (optional)
        } catch (error) {
            console.error('Error publishing session:', error);
            setError('Failed to publish session');
        }
    };

    const handleDeleteConfirm = async () => {
        if (selectedSessionIndex === null) return;

        try {
            const sessionId = sessions[selectedSessionIndex]._id;
            await ApiClient.delete(`/sessions/${sessionId}`);
            const updatedSessions = sessions.filter((_, index) => index !== selectedSessionIndex);
            setSessions(updatedSessions);
            setShowDeleteDialog(false);
        } catch (error) {
            console.error('Error deleting session:', error);
            setError('Failed to delete session');
        }
    };

    const handleRemoveUser = async () => {
        if (selectedUserIndex === null || selectedSessionIndex === null) return;

        try {
            const sessionId = sessions[selectedSessionIndex]._id;
            const userEmail = projectUsers[selectedUserIndex].email;
            await ApiClient.delete(`/sessions/${sessionId}/users/${encodeURIComponent(userEmail)}`);
            const updatedUsers = projectUsers.filter((_, index) => index !== selectedUserIndex);
            setProjectUsers(updatedUsers);
            setShowRemoveUserDialog(false);
        } catch (error) {
            console.error('Error removing user:', error);
            setError('Failed to remove user');
        }
    };

    const getStatusColor = (status: string | undefined) => {
        if (!status) return 'default';
        switch (status.toLowerCase()) {
            case 'processed':
                return 'success';
            case 'draft':
                return 'warning';
            case 'completed':
                return 'success';
            case 'in progress':
                return 'warning';
            case 'pending':
                return 'info';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: string | undefined) => {
        if (!status) return <PlayArrow />;
        switch (status.toLowerCase()) {
            case 'processed':
                return <PlayArrow />;
            case 'draft':
                return <Stop />;
            case 'completed':
                return <PlayArrow />;
            case 'in progress':
                return <Pause />;
            case 'pending':
                return <Stop />;
            default:
                return <PlayArrow />;
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

    // Add handler for processing all artifacts in a session
    const handleProcessAllArtifacts = async (sessionId: string) => {
        try {
            await fetch(`http://129.212.189.229:5000/sessions/${sessionId}/process`, {
                method: 'POST',
            });
            alert('Processing started for all artifacts in this session!');
            // Optionally refresh session/artifact status here
        } catch (err: any) {
            alert('Failed to process all artifacts: ' + (err?.message || err));
        }
    };

    if (isLoading) {
        return (
            <Container maxWidth="lg">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h4" component="h1">
                            Sessions
                        </Typography>
                        {projectName && (
                            <Typography variant="body1" color="textSecondary">
                                Project: {projectName}
                            </Typography>
                        )}
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={loadSessions}
                        disabled={isLoading}
                    >
                        Refresh
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={4} justifyContent="flex-start">
                    {sessions.map((session) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={session._id as string}>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    boxShadow: 3,
                                    transition: 'transform 0.15s',
                                    '&:hover': {
                                        transform: 'translateY(-4px) scale(1.03)',
                                        boxShadow: 6,
                                    },
                                    minHeight: 180,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                }}
                                onClick={() => router.push(`/sessions/${session._id}`)}
                            >
                                <CardContent sx={{ p: 3, position: 'relative' }}>
                                    {/* Edit/Delete Icons - top right */}
                                    <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1, zIndex: 2 }}>
                                        <IconButton
                                            size="small"
                                            aria-label="Edit Session"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setSelectedSessionIndex(sessions.findIndex(s => s._id === session._id));
                                                setEditForm({ name: session.description, description: session.description });
                                                setShowEditDialog(true);
                                            }}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            aria-label="Delete Session"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setSelectedSessionIndex(sessions.findIndex(s => s._id === session._id));
                                                setShowDeleteDialog(true);
                                            }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    {/* Title and Status Chip */}
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} mt={1}>
                                        <Typography variant="h6" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                                            {projectName || 'Project'}
                                        </Typography>
                                    </Box>
                                    <Box mb={2}>
                                        <Chip
                                            label={session.status || 'Unknown'}
                                            color={getStatusColor(session.status)}
                                            size="small"
                                            sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                                        <strong>Created:</strong> {session.createdAt ? new Date(session.createdAt).toLocaleString() : ''}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                                        <strong>Created By:</strong> {'Unknown'}
                                    </Typography>
                                    {session.description && (
                                        <Typography variant="body2" color="text.secondary" mt={1}>
                                            {session.description}
                                        </Typography>
                                    )}
                                    {/* Add VIEW and PROCESS ALL buttons */}
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            onClick={e => {
                                                e.stopPropagation();
                                                router.push(`/sessions/${session._id}`);
                                            }}
                                        >
                                            VIEW
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleProcessAllArtifacts(session._id);
                                            }}
                                        >
                                            PROCESS ALL
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {sessions.length === 0 && !isLoading && (
                    <Box textAlign="center" py={8}>
                        <PlayArrow sx={{ fontSize: 64, color: 'textSecondary', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            No sessions found
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Sessions will appear here once they are created and started.
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Session</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Session Name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={3}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
                    <Button onClick={handleEditConfirm} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Process Dialog */}
            <Dialog open={showProcessDialog} onClose={() => setShowProcessDialog(false)}>
                <DialogTitle>Process Session</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to process this session? This will analyze all captured artifacts.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowProcessDialog(false)}>Cancel</Button>
                    <Button onClick={handleProcessConfirm} variant="contained">
                        Process
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Publish Dialog */}
            <Dialog open={showPublishDialog} onClose={() => setShowPublishDialog(false)}>
                <DialogTitle>Publish Session</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to publish this session? This will make it available to all team members.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPublishDialog(false)}>Cancel</Button>
                    <Button onClick={handlePublishConfirm} variant="contained">
                        Publish
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Users Dialog */}
            <Dialog open={showUserDialog} onClose={() => setShowUserDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Session Users</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Current Users
                        </Typography>
                        {projectUsers.map((user, index) => (
                            <Box key={user.email} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                                <Box>
                                    <Typography variant="body1">{user.name}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {user.email} • {user.role}
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSelectedUserIndex(index);
                                        setShowRemoveUserDialog(true);
                                    }}
                                >
                                    <PersonAdd />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowUserDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Remove User Dialog */}
            <Dialog open={showRemoveUserDialog} onClose={() => setShowRemoveUserDialog(false)}>
                <DialogTitle>Remove User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to remove this user from the session?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRemoveUserDialog(false)}>Cancel</Button>
                    <Button onClick={handleRemoveUser} variant="contained" color="error">
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                <DialogTitle>Delete Session</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this session? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleMenuAction('view')}>
                    <ListItemIcon>
                        <Visibility fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>View</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('edit')}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('process')}>
                    <ListItemIcon>
                        <Refresh fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Process</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('publish')}>
                    <ListItemIcon>
                        <Upload fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Publish</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('users')}>
                    <ListItemIcon>
                        <PersonAdd fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Manage Users</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleMenuAction('delete')}>
                    <ListItemIcon>
                        <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Container>
    );
}

export default function SessionsPage() {
    return (
        <Suspense fallback={
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        }>
            <SessionsContent />
        </Suspense>
    );
} 