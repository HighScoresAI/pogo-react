import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    InputBase,
    Pagination,
    Stack
} from '@mui/material';
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
    user_name?: string;
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

const getActivityLabel = (activityType: string) => {
    switch (activityType) {
        case 'session_created':
            return 'Session created';
        case 'artifact_created':
            return 'Artifact created';
        case 'session_processed':
            return 'Session processed';
        case 'artifact_processed':
            return 'Artifact processed';
        case 'session_published':
            return 'Session published';
        case 'artifact_published':
            return 'Artifact published';
        case 'session_deleted':
            return 'Session deleted';
        case 'artifact_deleted':
            return 'Artifact deleted';
        case 'session_renamed':
            return 'Session renamed';
        case 'artifact_edited':
            return 'Artifact edited';
        case 'project_created':
            return 'Project created';
        case 'project_updated':
            return 'Project updated';
        case 'project_deleted':
            return 'Project deleted';
        case 'user_login':
            return 'User login';
        case 'user_logout':
            return 'User logout';
        case 'user_registered':
            return 'User registered';
        default:
            return activityType.replace('_', ' ');
    }
};

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return `${day} ${month} ${year}, ${time}`;
};

export default function ActivityLogList({ type, id, title }: ActivityLogListProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);

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

    const paginatedLogs = filteredLogs.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                {title && (
                    <Typography variant="h5" fontWeight={600} sx={{ color: '#222' }}>
                        {title}
                    </Typography>
                )}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: '#fff',
                    border: '1px solid #E5E5EA',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    minWidth: 200,
                    boxShadow: 'none'
                }}>
                    <Search sx={{ color: '#B0B8C1', fontSize: 20, mr: 1 }} />
                    <InputBase
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ fontSize: 14, color: '#222', width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
                        inputProps={{ 'aria-label': 'search' }}
                    />
                </Box>
            </Box>

            {/* Table container */}
            {paginatedLogs.length === 0 ? (
                // Empty state - no table headers
                <Paper sx={{
                    width: '100%',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    bgcolor: '#fff'
                }}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img
                                src="/Frame 1597882338.png"
                                alt="No activity"
                                style={{ width: 120, height: 80, objectFit: 'contain', marginBottom: 16 }}
                            />
                            <Typography sx={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
                                {searchTerm ? 'No activities match your search' : 'No activity yet – once actions are taken, they\'ll show up here!'}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            ) : (
                // Table with headers - only when there's data
                <Paper sx={{
                    width: '100%',
                    overflow: 'hidden',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#fafafa' }}>
                                    <TableCell sx={{
                                        fontWeight: 600,
                                        color: '#666',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2
                                    }}>
                                        Action
                                    </TableCell>
                                    <TableCell sx={{
                                        fontWeight: 600,
                                        color: '#666',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2
                                    }}>
                                        Taken by
                                    </TableCell>
                                    <TableCell sx={{
                                        fontWeight: 600,
                                        color: '#666',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2
                                    }}>
                                        Date & time
                                    </TableCell>
                                    <TableCell sx={{
                                        fontWeight: 600,
                                        color: '#666',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2
                                    }}>
                                        Description
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedLogs.map((log) => (
                                    <TableRow
                                        key={log._id}
                                        sx={{
                                            '&:hover': { bgcolor: '#fafafa' },
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                    >
                                        <TableCell sx={{ py: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getActivityIcon(log.activity_type)}
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#222' }}>
                                                    {getActivityLabel(log.activity_type)}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 2 }}>
                                            <Typography variant="body2" sx={{ color: '#666' }}>
                                                {log.metadata?.user_name || log.user_name || 'System'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 2 }}>
                                            <Typography variant="body2" sx={{ color: '#666' }}>
                                                {formatTimestamp(log.timestamp)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 2 }}>
                                            <Typography variant="body2" sx={{ color: '#222' }}>
                                                {log.description}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Pagination */}
            {filteredLogs.length > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={Math.ceil(filteredLogs.length / rowsPerPage)}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Box>
    );
} 