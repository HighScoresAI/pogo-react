import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, Chip, CircularProgress, InputBase } from '@mui/material';
import {
    PlayArrow,
    Pause,
    Delete,
    Edit,
    Publish,
    Create,
    Search,
    History,
    Description,
    Image,
    Audiotrack,
    Person
} from '@mui/icons-material';
import { ApiClient } from '../lib/api';

interface ActivityLog {
    _id: string;
    activity_type: string;
    description: string;
    timestamp: string;
    metadata?: any;
}

interface ActivityLogListProps {
    type: 'session' | 'artifact' | 'project';
    id: string;
    title?: string;
}

const getActivityIcon = (activityType: string) => {
    switch (activityType) {
        case 'session_created':
        case 'artifact_created':
            return <Create color="primary" />;
        case 'session_processed':
        case 'artifact_processed':
            return <PlayArrow color="info" />;
        case 'session_published':
        case 'artifact_published':
            return <Publish color="success" />;
        case 'session_deleted':
        case 'artifact_deleted':
            return <Delete color="error" />;
        case 'session_renamed':
        case 'artifact_edited':
            return <Edit color="warning" />;
        case 'project_created':
        case 'project_updated':
        case 'project_deleted':
            return <Description color="primary" />;
        case 'user_login':
        case 'user_logout':
        case 'user_registered':
            return <Person color="action" />;
        default:
            return <History color="action" />;
    }
};

const getActivityColor = (activityType: string) => {
    switch (activityType) {
        case 'session_processed':
        case 'artifact_processed':
            return '#E3F2FD';
        case 'session_published':
        case 'artifact_published':
            return '#E8F5E8';
        case 'session_deleted':
        case 'artifact_deleted':
            return '#FFEBEE';
        case 'session_renamed':
        case 'artifact_edited':
            return '#E1F5FE';
        case 'session_created':
        case 'artifact_created':
            return '#F3E5F5';
        case 'project_created':
        case 'project_updated':
        case 'project_deleted':
            return '#F1F8E9';
        case 'user_login':
        case 'user_logout':
        case 'user_registered':
            return '#FFF3E0';
        default:
            return '#FAFAFA';
    }
};

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
    } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

export default function ActivityLogList({ type, id, title }: ActivityLogListProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                console.log(`Fetching logs for type: ${type}, id: ${id}`);
                let response;

                switch (type) {
                    case 'session':
                        response = await ApiClient.getSessionLogs(id);
                        break;
                    case 'artifact':
                        response = await ApiClient.getArtifactLogs(id);
                        break;
                    case 'project':
                        response = await ApiClient.getProjectLogs(id);
                        break;
                    default:
                        throw new Error('Invalid log type');
                }

                console.log('API response:', response);
                setLogs(response.logs || []);
            } catch (err) {
                console.error('Error fetching logs:', err);
                setError('Failed to load activity logs');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchLogs();
        }
    }, [type, id]);

    const filteredLogs = logs.filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.activity_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header with search */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                {title && (
                    <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                        {title}
                    </Typography>
                )}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: '#fff',
                    border: '1px solid #E5E5EA',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    minWidth: 160,
                    boxShadow: 'none',
                    ml: 'auto'
                }}>
                    <Search sx={{ color: '#B0B8C1', fontSize: 22, mr: 1 }} />
                    <InputBase
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ fontSize: 15, color: '#222', width: 110, border: 'none', outline: 'none', background: 'transparent' }}
                        inputProps={{ 'aria-label': 'search' }}
                    />
                </Box>
            </Box>

            {/* Logs container */}
            <Box sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: '#fff',
                boxShadow: 1,
                position: 'relative',
                minHeight: 320,
                maxHeight: 600,
                overflowY: 'auto'
            }}>
                {filteredLogs.length === 0 ? (
                    // Empty state
                    <Box sx={{ mt: 6, mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img src="/Frame 1597882338.png" alt="No activity" style={{ width: 180, height: 120, objectFit: 'contain', marginBottom: 16 }} />
                        <Typography sx={{ color: '#888', fontSize: 15, textAlign: 'center' }}>
                            {searchTerm ? 'No activities match your search' : 'No activity yet – once actions are taken, they\'ll show up here!'}
                        </Typography>
                    </Box>
                ) : (
                    // Logs list
                    <List sx={{ p: 0 }}>
                        {filteredLogs.map((log) => (
                            <ListItem
                                key={log._id}
                                sx={{
                                    borderBottom: '1px solid #f0f0f0',
                                    '&:last-child': { borderBottom: 'none' },
                                    py: 2,
                                    px: 0
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getActivityIcon(log.activity_type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {log.description}
                                            </Typography>
                                            <Chip
                                                label={log.activity_type.replace('_', ' ')}
                                                size="small"
                                                sx={{
                                                    bgcolor: getActivityColor(log.activity_type),
                                                    color: '#666',
                                                    fontSize: '0.7rem',
                                                    height: 20
                                                }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {formatTimestamp(log.timestamp)}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );
} 