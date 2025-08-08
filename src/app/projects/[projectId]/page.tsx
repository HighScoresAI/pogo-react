"use client";
import React, { useEffect, useState } from 'react';
import { Box, Typography, Breadcrumbs, Link, Card, Avatar, IconButton, Button, TextField, InputAdornment, Menu, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, Pagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import Header from '../../../components/layout/Header';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useParams } from 'next/navigation';
import { ApiClient } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const mockTeam = [
    { name: 'Darlene Robertson', role: 'Owner', avatar: '', },
    { name: 'Darlene Robertson', role: 'Viewer', avatar: '', },
    { name: 'Darlene Robertson', role: 'Contributor', avatar: '', },
];



export default function ProjectDetailsStatic() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [menuIdx, setMenuIdx] = React.useState<number | null>(null);
    const [search, setSearch] = React.useState('');
    const [page, setPage] = useState(1); // Default to page 1
    const sessionsPerPage = 10;
    const [overviewStats, setOverviewStats] = useState([
        { label: 'Sessions', value: 0, icon: <img src="/Frame (2).svg" alt="Sessions" style={{ width: 28, height: 28 }} /> },
        { label: 'Draft Sessions', value: 0, icon: <img src="/draft session.svg" alt="Draft Sessions" style={{ width: 28, height: 28 }} /> },
        { label: 'Processed Session', value: 0, icon: <img src="/magic-star.svg" alt="Processed Session" style={{ width: 28, height: 28 }} /> },
        { label: 'Published Sessions', value: 0, icon: <img src="/published.svg" alt="Published Sessions" style={{ width: 28, height: 28 }} /> },
    ]);
    const [projectDetails, setProjectDetails] = useState<{ name?: string; projectName?: string; description?: string; createdAt?: string; createdBy?: string } | null>(null);
    const [creatorName, setCreatorName] = useState<string>('');
    const [createdAt, setCreatedAt] = useState<string>('');
    const [sessions, setSessions] = useState<Array<{ _id: string; name?: string; createdBy?: string; createdAt?: string; status?: string; calculatedStatus?: string; artifacts?: Array<{ _id: string; captureType?: string; url?: string }>; updatedBy?: string; lastUpdatedBy?: string; updatedAt?: string; lastUpdatedAt?: string }>>([]);
    const [userMap, setUserMap] = useState<{ [userId: string]: string }>({});
    const params = useParams();
    const projectId = params?.projectId;
    const router = useRouter();
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [selectedSessionIdx, setSelectedSessionIdx] = useState<number | null>(null);

    useEffect(() => {
        async function fetchStats() {
            if (!projectId) return;
            try {
                // Add cache-busting parameter to force fresh data
                const timestamp = Date.now();
                const stats = await ApiClient.get<{ total?: number; draft?: number; processed?: number; published?: number }>(`/projects/${projectId}/session-stats?t=${timestamp}`);
                console.log('Fetched project stats:', stats); // Debug log
                setOverviewStats([
                    { label: 'Sessions', value: stats.total ?? 0, icon: <img src="/Frame (2).svg" alt="Sessions" style={{ width: 28, height: 28 }} /> },
                    { label: 'Draft Sessions', value: stats.draft ?? 0, icon: <img src="/draft session.svg" alt="Draft Sessions" style={{ width: 28, height: 28 }} /> },
                    { label: 'Processed Session', value: stats.processed ?? 0, icon: <img src="/magic-star.svg" alt="Processed Session" style={{ width: 28, height: 28 }} /> },
                    { label: 'Published Sessions', value: stats.published ?? 0, icon: <img src="/published.svg" alt="Published Sessions" style={{ width: 28, height: 28 }} /> },
                ]);
            } catch (error) {
                console.error('Error fetching project stats:', error); // Debug log
                setOverviewStats([
                    { label: 'Sessions', value: 0, icon: <img src="/Frame (2).svg" alt="Sessions" style={{ width: 28, height: 28 }} /> },
                    { label: 'Draft Sessions', value: 0, icon: <img src="/draft session.svg" alt="Draft Sessions" style={{ width: 28, height: 28 }} /> },
                    { label: 'Processed Session', value: 0, icon: <img src="/magic-star.svg" alt="Processed Session" style={{ width: 28, height: 28 }} /> },
                    { label: 'Published Sessions', value: 0, icon: <img src="/published.svg" alt="Published Sessions" style={{ width: 28, height: 28 }} /> },
                ]);
            }
        }
        fetchStats();

        // Refresh stats every 5 seconds to ensure we have the latest data
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [projectId]);

    useEffect(() => {
        async function fetchProjectDetails() {
            if (!projectId) return;
            try {
                const project = await ApiClient.get<{ name?: string; projectName?: string; description?: string; createdAt?: string; createdBy?: string }>(`/projects/${projectId}`);
                setProjectDetails(project);
                if (project.createdBy) {
                    try {
                        const user = await ApiClient.get<{ firstName?: string; lastName?: string; email?: string }>(`/users/${project.createdBy}`);
                        setCreatorName(user.firstName || '');
                    } catch {
                        setCreatorName('');
                    }
                }
                if (project.createdAt) {
                    setCreatedAt(new Date(project.createdAt).toLocaleString());
                }
            } catch {
                setProjectDetails(null);
                setCreatorName('');
                setCreatedAt('');
            }
        }
        fetchProjectDetails();
    }, [projectId]);

    useEffect(() => {
        async function fetchSessions() {
            if (!projectId) return;
            try {
                const data = await ApiClient.get<Array<{ _id: string; name?: string; createdBy?: string; createdAt?: string; status?: string; artifacts?: Array<{ _id: string; captureType?: string; url?: string }>; updatedBy?: string; lastUpdatedBy?: string; updatedAt?: string; lastUpdatedAt?: string }>>(`/projects/${projectId}/sessions`);

                // Use the session status from the backend
                const sessionsWithStatus = data.map((session) => {
                    return { ...session, calculatedStatus: session.status || 'draft' };
                });

                setSessions(sessionsWithStatus);
            } catch {
                setSessions([]);
            }
        }
        fetchSessions();
    }, [projectId]);

    useEffect(() => {
        async function fetchUserNames() {
            const userIds = Array.from(new Set(sessions.map((s) => s.createdBy).filter(Boolean)));
            const userMapTemp: { [userId: string]: string } = {};
            await Promise.all(userIds.map(async (userId) => {
                try {
                    const user = await ApiClient.get<{ firstName?: string; lastName?: string; email?: string }>(`/users/${userId}`);
                    if (userId) {
                        userMapTemp[userId] = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email || userId;
                    }
                } catch {
                    if (userId) {
                        userMapTemp[userId] = userId;
                    }
                }
            }));
            setUserMap(userMapTemp);
        }
        if (sessions.length > 0) fetchUserNames();
    }, [sessions]);
    // Create refs for each TableRow
    const rowRefs = React.useRef<(HTMLTableRowElement | null)[]>([]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, idx: number) => {
        setAnchorEl(rowRefs.current[idx]);
        setMenuIdx(idx);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuIdx(null);
    };

    const handleViewSession = (sessionId: string) => {
        router.push(`/sessions/${sessionId}`);
        handleMenuClose();
    };

    const handleRenameClick = (idx: number) => {
        setSelectedSessionIdx(idx);
        setRenameValue(sessions[idx]?.name || '');
        setRenameDialogOpen(true);
    };
    const handleDeleteClick = (idx: number) => {
        setSelectedSessionIdx(idx);
        setDeleteDialogOpen(true);
    };
    const handleRenameSession = async () => {
        if (selectedSessionIdx === null) return;
        const session = sessions[selectedSessionIdx];
        try {
            await ApiClient.put(`/sessions/${session._id}`, { name: renameValue });
            const updatedSession = { ...session, name: renameValue, updatedAt: new Date().toISOString() };
            const updatedSessions = [...sessions];
            updatedSessions[selectedSessionIdx] = updatedSession;
            updatedSessions.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
            setSessions(updatedSessions);
            setSnackbar({ open: true, message: 'Session renamed successfully!', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to rename session.', severity: 'error' });
        }
        setRenameDialogOpen(false);
    };
    const handleDeleteSession = async () => {
        if (selectedSessionIdx === null) return;
        const session = sessions[selectedSessionIdx];
        try {
            await ApiClient.delete(`/sessions/${session._id}`);
            const updatedSessions = sessions.filter((_, idx) => idx !== selectedSessionIdx);
            setSessions(updatedSessions);
            setSnackbar({ open: true, message: 'Session deleted successfully!', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to delete session.', severity: 'error' });
        }
        setDeleteDialogOpen(false);
    };

    const filteredSessions = sessions.filter(
        (row) => (row.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{ bgcolor: '#fafbfc', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
            <Header />
            {/* Purple Banner */}
            <Box sx={{ width: '100%', height: 160, background: 'url(/purple-bg.png) center/cover no-repeat', mb: { xs: 2, md: 4 } }} />
            {/* Centered Main Content */}
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', ml: { xs: 0, md: 8 } }}>
                <Box sx={{ px: { xs: 2, md: 6 }, pt: 4, maxWidth: 1400, width: '100%' }}>
                    {/* Breadcrumb */}
                    <Breadcrumbs sx={{ mb: 1 }} aria-label="breadcrumb">
                        <Link underline="hover" color="inherit" href="/dashboard">Dashboard</Link>
                        <Typography color="text.primary">Workspace {projectDetails?.name || projectDetails?.projectName || ''}</Typography>
                    </Breadcrumbs>
                    {/* Title & Subtitle */}
                    <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>Workspace {projectDetails?.name || projectDetails?.projectName || 'Project'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Created: {creatorName}{createdAt ? `, ${createdAt}` : ''}
                    </Typography>
                    {/* Main Layout */}
                    {/* Overview + Team Row */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, mb: 4 }}>
                        {/* Overview (left) */}
                        <Box sx={{ maxWidth: 700, flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600}>Overview</Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        const timestamp = Date.now();
                                        ApiClient.get<{ total?: number; draft?: number; processed?: number; published?: number }>(`/projects/${projectId}/session-stats?t=${timestamp}`)
                                            .then(stats => {
                                                console.log('Manual refresh - Fetched project stats:', stats);
                                                setOverviewStats([
                                                    { label: 'Sessions', value: stats.total ?? 0, icon: <img src="/Frame (2).svg" alt="Sessions" style={{ width: 28, height: 28 }} /> },
                                                    { label: 'Draft Sessions', value: stats.draft ?? 0, icon: <img src="/draft session.svg" alt="Draft Sessions" style={{ width: 28, height: 28 }} /> },
                                                    { label: 'Processed Session', value: stats.processed ?? 0, icon: <img src="/magic-star.svg" alt="Processed Session" style={{ width: 28, height: 28 }} /> },
                                                    { label: 'Published Sessions', value: stats.published ?? 0, icon: <img src="/published.svg" alt="Published Sessions" style={{ width: 28, height: 28 }} /> },
                                                ]);
                                            })
                                            .catch(error => console.error('Manual refresh error:', error));
                                    }}
                                >
                                    Refresh Stats
                                </Button>
                            </Box>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                    gap: 2,
                                }}
                            >
                                {overviewStats.map((item) => (
                                    <Card key={item.label} sx={{
                                        border: '1px solid #E5EAF2',
                                        boxShadow: 'none',
                                        borderRadius: 4,
                                        minHeight: 90,
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 3,
                                        py: 2.5,
                                    }}>
                                        <Avatar sx={{ bgcolor: '#D6F5D6', color: '#222', width: 44, height: 44, mr: 2, fontSize: 26 }}>
                                            {item.icon}
                                        </Avatar>
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 0.5,
                                                    color: '#242426',
                                                    fontFamily: 'Inter, sans-serif',
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    fontStyle: 'normal',
                                                    lineHeight: 'normal',
                                                }}
                                            >
                                                {item.label}
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700}>{item.value}</Typography>
                                        </Box>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                        {/* Team Sidebar (right) */}
                        <Box sx={{ width: 320, flexShrink: 0 }}>
                            <Card sx={{ borderRadius: 3, boxShadow: 'none', p: 2, background: 'transparent' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>Team</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography
                                            component="a"
                                            href="#"
                                            sx={{
                                                color: '#00AAF8',
                                                fontFamily: 'Inter, sans-serif',
                                                fontSize: 16,
                                                fontWeight: 600,
                                                fontStyle: 'normal',
                                                lineHeight: 'normal',
                                                textDecoration: 'none',
                                                cursor: 'pointer',
                                                ml: 0.5,
                                            }}
                                        >
                                            Add members
                                        </Typography>
                                    </Box>
                                </Box>
                                <Stack spacing={1.5} sx={{ mt: 1 }}>
                                    {mockTeam.map((member, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar
                                                    src={member.avatar || undefined}
                                                    alt={member.name}
                                                    sx={{ width: 36, height: 36, bgcolor: member.avatar ? undefined : '#e3e7ef', color: '#222', fontSize: 18 }}
                                                >
                                                    {!member.avatar && <PersonIcon />}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{member.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{member.role}</Typography>
                                                </Box>
                                            </Box>
                                            <IconButton>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Stack>
                            </Card>
                        </Box>
                    </Box>
                    {/* Sessions Section (below Overview+Team row) */}
                    <Box sx={{ maxWidth: 1020, width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
                            <Typography variant="h6" fontWeight={600}>Sessions</Typography>
                            <TextField
                                size="small"
                                placeholder="Search by session name"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: 260, borderRadius: '999px', '& .MuiOutlinedInput-root': { borderRadius: '999px' } }}
                            />
                        </Box>
                        <TableContainer component={Paper} sx={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)', width: '100%', display: 'flex', flexDirection: 'column', borderRadius: 12 }}>
                            <Table style={{ minWidth: 800 }}>
                                <TableHead>
                                    <TableRow sx={{ background: '#f5f6fa' }}>
                                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Session Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Created</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Audio / Images</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Last updated</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}></TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredSessions.slice((page - 1) * sessionsPerPage, page * sessionsPerPage).map((row, idx) => {
                                        const lastUserId = row.updatedBy || row.lastUpdatedBy || row.createdBy;
                                        const lastDate = row.updatedAt || row.lastUpdatedAt || row.createdAt;
                                        const audioCount = (row.artifacts || []).filter((a: { captureType?: string }) => a.captureType === 'audio').length;
                                        const imageCount = (row.artifacts || []).filter((a: { captureType?: string }) => a.captureType === 'image' || a.captureType === 'screenshot').length;
                                        return (
                                            <TableRow
                                                key={idx + (page - 1) * sessionsPerPage}
                                                ref={el => { rowRefs.current[idx] = el; }}
                                                sx={{ background: idx % 2 === 1 ? '#fcfcfd' : 'white', cursor: 'pointer' }}
                                                onClick={e => {
                                                    if ((e.target as HTMLElement).closest('.session-menu-btn')) return;
                                                    handleMenuOpen(e, idx + (page - 1) * sessionsPerPage);
                                                }}
                                            >
                                                <TableCell sx={{ py: 2.2 }}>
                                                    <Typography fontWeight={600}>{row._id}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }}>
                                                    <Typography variant="body2" fontWeight={500}>{row.createdBy ? userMap[row.createdBy] || row.createdBy : '-'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography variant="body2" fontWeight={600}>
                                                            <span role="img" aria-label="audio">🎤</span> {audioCount}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">/</Typography>
                                                        <img src="/img.png" alt="Images" style={{ width: 20, height: 20, objectFit: 'contain', verticalAlign: 'middle' }} />
                                                        <Typography variant="body2" fontWeight={600}>{imageCount}</Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }}>
                                                    <Typography variant="body2" fontWeight={500}>{lastUserId ? userMap[lastUserId] || lastUserId : '-'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{lastDate ? new Date(lastDate).toLocaleString() : '-'}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }}>
                                                    {(() => {
                                                        const status = (row.calculatedStatus || row.status || '').toLowerCase();
                                                        let label = '';
                                                        let bgColor = '';
                                                        let dotColor = '';
                                                        let textColor = '';
                                                        if (status === 'draft') {
                                                            label = 'Draft';
                                                            bgColor = 'rgba(255, 152, 0, 0.08)';
                                                            dotColor = '#E69138';
                                                            textColor = '#E69138';
                                                        } else if (status === 'processed') {
                                                            label = 'Processed';
                                                            bgColor = 'rgba(33, 150, 243, 0.08)';
                                                            dotColor = '#2196F3';
                                                            textColor = '#2196F3';
                                                        } else if (status === 'published' || status === 'completed') {
                                                            label = 'Published';
                                                            bgColor = 'rgba(76, 175, 80, 0.10)';
                                                            dotColor = '#388E3C';
                                                            textColor = '#388E3C';
                                                        } else {
                                                            label = row.calculatedStatus || row.status || 'Unknown';
                                                            bgColor = 'rgba(0,0,0,0.04)';
                                                            dotColor = '#222';
                                                            textColor = '#222';
                                                        }
                                                        return (
                                                            <Box
                                                                sx={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    px: 1.5,
                                                                    py: 0.5,
                                                                    borderRadius: 2,
                                                                    fontWeight: 600,
                                                                    fontSize: 13,
                                                                    bgcolor: bgColor,
                                                                    color: textColor,
                                                                    minWidth: 80,
                                                                    justifyContent: 'flex-start',
                                                                    border: 'none',
                                                                    gap: 1,
                                                                }}
                                                            >
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: '50%',
                                                                        bgcolor: dotColor,
                                                                        display: 'inline-block',
                                                                        mr: 1,
                                                                    }}
                                                                />
                                                                {label}
                                                            </Box>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 2.2 }}>
                                                    <IconButton
                                                        className="session-menu-btn"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleMenuOpen(e, idx + (page - 1) * sessionsPerPage);
                                                        }}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 2.2 }}>
                                                    <IconButton
                                                        className="session-view-btn"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleViewSession(row._id);
                                                        }}
                                                    >
                                                        <ChevronRightIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, pb: 4, borderTop: '1px solid #eee', bgcolor: 'background.paper' }}>
                                <Pagination
                                    count={Math.ceil(filteredSessions.length / sessionsPerPage)}
                                    page={page}
                                    onChange={(_, v) => setPage(v)}
                                    color="primary"
                                    shape="rounded"
                                    variant="outlined"
                                    sx={{
                                        '& .MuiPagination-ul': {
                                            border: '1px solid #E5EAF2',
                                            borderRadius: 3,
                                            background: '#fff',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                            px: 1,
                                        },
                                        '& .MuiPaginationItem-root': {
                                            border: 'none',
                                            minWidth: 36,
                                            height: 36,
                                            margin: 0,
                                        },
                                    }}
                                />
                            </Box>
                        </TableContainer>
                        <Box sx={{ height: 40 }} />
                    </Box>
                </Box>
            </Box>
            {/* Render the menu only once, outside the map */}
            <Menu
                anchorEl={anchorEl}
                open={menuIdx !== null}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
            >
                <MenuItem onClick={() => handleViewSession(sessions[menuIdx ?? 0]?._id)}>
                    <img src="/view.svg" alt="View" style={{ width: 18, marginRight: 8 }} />View
                </MenuItem>
                <MenuItem onClick={() => { handleRenameClick(menuIdx ?? 0); handleMenuClose(); }}>
                    <img src="/edit.svg" alt="Rename" style={{ width: 18, marginRight: 8 }} />Rename
                </MenuItem>
                <MenuItem sx={{ color: 'error.main' }} onClick={() => { handleDeleteClick(menuIdx ?? 0); handleMenuClose(); }}>
                    <img src="/delete.svg" alt="Delete" style={{ width: 18, marginRight: 8 }} />Delete
                </MenuItem>
            </Menu>
            <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
                <DialogTitle>Rename Session</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Session Name"
                        type="text"
                        fullWidth
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRenameSession} variant="contained">Rename</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Session</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this session? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteSession} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <MuiAlert elevation={6} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
} 