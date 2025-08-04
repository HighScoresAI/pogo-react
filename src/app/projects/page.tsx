
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
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
  TextField,
  InputAdornment,
  Paper,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Edit,
  PersonAdd,
  Delete,
  CalendarToday,
  Search,
  Sort,
  ViewModule,
  ViewList,
  DateRange,
  Folder,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types/project';
import { ApiClient } from '../../lib/api';

import Popover from '@mui/material/Popover';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import MemberManagementModal from '../../components/MemberManagementModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [projectStats, setProjectStats] = useState<{ [projectId: string]: { sessions: number; artifacts: number; lastSessionDate: string | null; loading: boolean } }>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [sortBy, setSortBy] = useState('recent');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectError, setNewProjectError] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferError, setTransferError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [userMap, setUserMap] = useState<{ [userId: string]: string }>({});

  const router = useRouter();
  const { getUserId } = useAuth();

  // Utility function to validate MongoDB ObjectId
  function isValidObjectId(id: string) {
    return /^[a-f\d]{24}$/i.test(id);
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const userId = getUserId();
        if (!userId) {
          console.error('No user ID found');
          setLoading(false);
          return;
        }
        const projectsData = await ApiClient.get<Project[]>(`/users/${userId}/projects`);
        setProjects(projectsData || []);
        // Fetch session/artifact counts for each project
        const stats: { [projectId: string]: { sessions: number; artifacts: number; lastSessionDate: string | null; loading: boolean } } = {};
        await Promise.all((projectsData || []).map(async (project) => {
          if (!isValidObjectId(project.projectId)) {
            stats[project.projectId] = { sessions: 0, artifacts: 0, lastSessionDate: null, loading: false };
            return;
          }
          stats[project.projectId] = { sessions: 0, artifacts: 0, lastSessionDate: null, loading: true };
          try {
            const sessions = await ApiClient.get<Array<{ artifacts?: Array<unknown>; createdAt?: string }>>(`/projects/${project.projectId}/sessions`);
            stats[project.projectId].sessions = Array.isArray(sessions) ? sessions.length : 0;
            stats[project.projectId].artifacts = Array.isArray(sessions)
              ? sessions.reduce((sum, s) => sum + (Array.isArray(s.artifacts) ? s.artifacts.length : 0), 0)
              : 0;
            // Find latest session date
            if (Array.isArray(sessions) && sessions.length > 0) {
              const latest = sessions.reduce((max, s) => {
                const date = s.createdAt ? new Date(s.createdAt).getTime() : 0;
                return date > max ? date : max;
              }, 0);
              stats[project.projectId].lastSessionDate = latest ? new Date(latest).toLocaleString() : null;
            } else {
              stats[project.projectId].lastSessionDate = null;
            }
          } catch {
            stats[project.projectId].sessions = 0;
            stats[project.projectId].artifacts = 0;
            stats[project.projectId].lastSessionDate = null;
          }
          stats[project.projectId].loading = false;
        }));
        setProjectStats(stats);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [getUserId]);

  useEffect(() => {
    async function fetchUserNames() {
      const userIds = Array.from(new Set(projects.map((p) => p.createdBy).filter(Boolean)));
      const userMapTemp: { [userId: string]: string } = {};
      await Promise.all(userIds.map(async (userId) => {
        if (!userId) return;
        try {
          const user = await ApiClient.get(`/users/${userId}`);
          userMapTemp[userId] = (user as any).firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim() : (user as any).email || userId;
        } catch {
          userMapTemp[userId] = userId;
        }
      }));
      setUserMap(userMapTemp);
    }
    if (projects.length > 0) fetchUserNames();
  }, [projects]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Do NOT reset selectedProjectIndex here, so the edit dialog works
    // setSelectedProjectIndex(null);
  };

  const handleMenuAction = (action: string) => {
    if (selectedProjectIndex === null) return;
    const project = projects[selectedProjectIndex];
    if (!isValidObjectId(project.projectId)) {
      alert('Invalid project ID!');
      return;
    }
    switch (action) {
      case 'view':
        router.push(`/projects/${project.projectId}`);
        break;
      case 'edit':
        setEditForm({
          name: project.projectName,
          description: project.description || '',
        });
        setShowEditDialog(true);
        break;
      case 'transfer':
        setShowTransferDialog(true);
        break;
      case 'delete':
        setShowDeleteDialog(true);
        break;
    }
    handleMenuClose();
  };

  const handleEditSave = async () => {
    console.log('SAVE button clicked');
    if (selectedProjectIndex === null) {
      console.log('No project selected');
      return;
    }
    try {
      console.log('Sending API request to update project:', projects[selectedProjectIndex].projectId, editForm);
      await ApiClient.put(`/projects/${projects[selectedProjectIndex].projectId}`, editForm);
      console.log('API request successful');
      const updatedProjects = [...projects];
      updatedProjects[selectedProjectIndex] = {
        ...updatedProjects[selectedProjectIndex],
        projectName: editForm.name,
        description: editForm.description,
      };
      setProjects(updatedProjects);
      setShowEditDialog(false);
      setError('');
      setSnackbar({ open: true, message: 'Project updated successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project');
      setShowEditDialog(false);
      setSnackbar({ open: true, message: 'Failed to update project.', severity: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedProjectIndex === null) return;

    try {
      await ApiClient.delete(`/projects/${projects[selectedProjectIndex].projectId}`);

      // Remove from local state
      const updatedProjects = projects.filter((_, index) => index !== selectedProjectIndex);
      setProjects(updatedProjects);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
    }
  };

  const handleTransferConfirm = async () => {
    if (selectedProjectIndex === null || !transferEmail.trim()) return;

    try {
      setTransferError('');

      // First, find the user by email
      const user = await ApiClient.getUserByEmail(transferEmail);
      if (!user || !user._id) {
        setTransferError('User not found with this email address');
        return;
      }

      // Transfer ownership by changing the role to 'owner'
      await ApiClient.put(`/projects/${projects[selectedProjectIndex].projectId}/role/${user._id}`, {
        role: 'owner'
      });

      // Update local state to reflect the change
      const updatedProjects = [...projects];
      // Note: In a real implementation, you might want to refresh the project data
      // or update the current user's role in the project
      setProjects(updatedProjects);

      setShowTransferDialog(false);
      setTransferEmail('');
      setTransferError('');
    } catch (error) {
      console.error('Error transferring ownership:', error);
      setTransferError('Failed to transfer ownership. Please try again.');
    }
  };



  // Filtering, searching, and sorting logic
  const filteredProjects = projects
    .filter(project => {
      // Search: project name, description
      if (searchTerm.length >= 2) {
        const search = searchTerm.toLowerCase();
        const name = project.projectName?.toLowerCase() || '';
        const desc = project.description?.toLowerCase() || '';
        if (!name.includes(search) && !desc.includes(search)) {
          return false;
        }
      }
      // Status filter
      if (filterStatus.length > 0) {
        if (
          filterStatus.includes('unprocessed') && !(project.sessions?.some((s: { processed?: boolean }) => !s.processed))
        ) return false;
        if (
          filterStatus.includes('processed') && !(project.sessions?.every((s: { processed?: boolean }) => s.processed))
        ) return false;
        if (
          filterStatus.includes('none') && (project.sessions?.length ?? 0) > 0
        ) return false;
      }
      // Date range filter (using updatedAt)
      if (filterDate) {
        const updated = new Date(project.updatedAt);
        const now = new Date();
        if (filterDate === '7d' && (now.getTime() - updated.getTime()) > 7 * 24 * 60 * 60 * 1000) return false;
        if (filterDate === '30d' && (now.getTime() - updated.getTime()) > 30 * 24 * 60 * 60 * 1000) return false;
        if (filterDate === 'year' && updated.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'created_new' || sortBy === 'created_old') {
        // No createdAt, so fallback to updatedAt
        return sortBy === 'created_new'
          ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (sortBy === 'az') {
        return (a.projectName || '').localeCompare(b.projectName || '');
      }
      if (sortBy === 'za') {
        return (b.projectName || '').localeCompare(a.projectName || '');
      }
      if (sortBy === 'sessions') {
        return (b.sessions?.length ?? 0) - (a.sessions?.length ?? 0);
      }
      return 0;
    });

  // Handler for sending invites (integrated with backend)
  const handleSendInvites = async (emails: string[], role: string) => {
    if (projects.length === 0) throw new Error('No project available');
    const projectId = projects[0].projectId; // For demo, use the first project
    const results: { emails: string[], links: string[] } = { emails: [], links: [] };
    for (const email of emails) {
      try {
        const user = await ApiClient.getUserByEmail(email);
        if (user && typeof user === 'object' && '_id' in user && typeof user._id === 'string' && user._id) {
          await ApiClient.addProjectMember(projectId, user._id, role);
          if (typeof email === 'string' && email.trim()) {
            results.emails.push(email);
          } else {
            results.emails.push('Invalid email');
          }
          results.links.push('');
        } else {
          // If user not found, send invite
          const inviteRes = await ApiClient.inviteProjectMember(projectId, email, role) as unknown as { inviteLink?: string };
          if (typeof email === 'string' && email.trim()) {
            results.emails.push(email);
          } else {
            results.emails.push('Invalid email');
          }
          results.links.push(inviteRes.inviteLink || '');
        }
      } catch {
        // If user lookup fails, try invite
        try {
          const inviteRes = await ApiClient.inviteProjectMember(projectId, email, role) as unknown as { inviteLink?: string };
          if (typeof email === 'string' && email.trim()) {
            results.emails.push(email);
          } else {
            results.emails.push('Invalid email');
          }
          results.links.push(inviteRes.inviteLink || '');
        } catch {
          results.emails.push(`Error inviting: ${email}`);
          results.links.push('');
        }
      }
    }
    return results;
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setNewProjectError('Project name is required');
      return;
    }
    try {
      // getUserId() should return the user's ObjectId, not email
      // If it returns email, you must update AuthContext to store and return the user's _id
      const userId = getUserId();
      const res = await ApiClient.post('/projects', {
        name: newProjectName,
        description: newProjectDescription,
        createdBy: userId, // This must be the ObjectId
      });
      // Add the new project to the list
      setProjects(prev => [res, ...prev]);
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectError('');
      setSnackbar({ open: true, message: 'Project created successfully!', severity: 'success' });
    } catch {
      setNewProjectError('Failed to create project');
      setSnackbar({ open: true, message: 'Failed to create project.', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex justify-center items-center min-h-screen">
        <Alert severity="error">Error loading projects: {error.toString()}</Alert>
      </Box>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Box className="flex justify-center items-center min-h-screen">
        <Alert severity="info">No projects found.</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Controls Grouped in Paper */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        {/* Search Bar with Recent Searches */}
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={e => {
              const value = e.target.value.trimStart();
              setSearchTerm(value);
              if (
                value.length >= 2 &&
                value.trim() !== '' &&
                !recentSearches.some(s => s.toLowerCase() === value.toLowerCase())
              ) {
                setRecentSearches([value, ...recentSearches.slice(0, 4)]);
              }
            }}
            onFocus={e => setSearchAnchorEl(e.currentTarget)}
            onBlur={() => setTimeout(() => setSearchAnchorEl(null), 200)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Popover
            open={Boolean(searchAnchorEl) && recentSearches.length > 0}
            anchorEl={searchAnchorEl}
            onClose={() => setSearchAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Box sx={{ p: 1, minWidth: 200 }}>
              <Typography variant="caption" color="textSecondary">Recent searches</Typography>
              {recentSearches.map((s, i) => (
                <MenuItem key={i} onClick={() => { setSearchTerm(s); setSearchAnchorEl(null); }}>{s}</MenuItem>
              ))}
            </Box>
          </Popover>
        </Box>
        {/* Sort Dropdown */}
        <TextField
          select
          size="small"
          label="Sort by"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          sx={{ minWidth: 160 }}
          InputProps={{ startAdornment: <Sort sx={{ mr: 1 }} /> }}
        >
          <MenuItem value="recent">
            {sortBy === 'recent' && <CheckIcon fontSize="small" sx={{ mr: 1 }} />}
            Recently updated
          </MenuItem>
          <MenuItem value="created_new">
            {sortBy === 'created_new' && <CheckIcon fontSize="small" sx={{ mr: 1 }} />}
            Date created (newest)
          </MenuItem>
          <MenuItem value="created_old">
            {sortBy === 'created_old' && <CheckIcon fontSize="small" sx={{ mr: 1 }} />}
            Date created (oldest)
          </MenuItem>
          <MenuItem value="az">
            {sortBy === 'az' && <CheckIcon fontSize="small" sx={{ mr: 1 }} />}
            Alphabetical (A-Z)
          </MenuItem>
          <MenuItem value="za">
            {sortBy === 'za' && <CheckIcon fontSize="small" sx={{ mr: 1 }} />}
            Alphabetical (Z-A)
          </MenuItem>
          <MenuItem value="sessions">
            {sortBy === 'sessions' && <CheckIcon fontSize="small" sx={{ mr: 1 }} />}
            Most sessions
          </MenuItem>
        </TextField>
        {/* Filter Controls */}
        <TextField
          select
          size="small"
          label="Status"
          value={filterStatus}
          onChange={e => setFilterStatus(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
          SelectProps={{ multiple: true }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="unprocessed">Has unprocessed sessions</MenuItem>
          <MenuItem value="processed">All processed</MenuItem>
          <MenuItem value="none">No sessions</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Date range"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          sx={{ minWidth: 140 }}
          InputProps={{ startAdornment: <DateRange sx={{ mr: 1 }} /> }}
        >
          <MenuItem value="">Any time</MenuItem>
          <MenuItem value="7d">Last 7 days</MenuItem>
          <MenuItem value="30d">Last 30 days</MenuItem>
          <MenuItem value="year">This year</MenuItem>
        </TextField>
        {/* View Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
          <IconButton onClick={() => setViewMode('card')} color={viewMode === 'card' ? 'primary' : 'default'}>
            <ViewModule />
          </IconButton>
          <IconButton onClick={() => setViewMode('list')} color={viewMode === 'list' ? 'primary' : 'default'}>
            <ViewList />
          </IconButton>
        </Box>
        {/* Create New Project Button */}
        <Button variant="contained" color="primary" sx={{ ml: 2, whiteSpace: 'nowrap' }} onClick={() => setShowCreateModal(true)}>
          Create New Project
        </Button>
      </Paper>
      <Divider sx={{ mb: 3 }} />
      {/* Active Filter Chips */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {filterStatus.map((status) => (
          <Chip
            key={status}
            label={
              status === 'unprocessed' ? 'Has unprocessed sessions' :
                status === 'processed' ? 'All processed' :
                  status === 'none' ? 'No sessions' : status
            }
            onDelete={() => setFilterStatus(filterStatus.filter(s => s !== status))}
            color="primary"
            size="small"
          />
        ))}
        {filterDate && filterDate !== '' && (
          <Chip
            label={
              filterDate === '7d' ? 'Last 7 days' :
                filterDate === '30d' ? 'Last 30 days' :
                  filterDate === 'year' ? 'This year' : 'Date filter'
            }
            onDelete={() => setFilterDate('')}
            color="primary"
            size="small"
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" color="secondary" onClick={() => setShowMemberModal(true)}>
          Manage Members
        </Button>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {viewMode === 'card' ? (
        <Grid container spacing={3}>
          {filteredProjects.map((project, index) => (
            <Grid item xs={12} md={6} lg={4} key={project.projectId}>
              <Paper elevation={3} sx={{ p: 0, height: '100%', borderRadius: 3, background: '#fafbfc', border: '1px solid #ececec' }}>
                <Card className="h-full" sx={{ boxShadow: 'none', height: '100%', background: 'transparent' }}>
                  <CardContent sx={{ position: 'relative', p: 3 }}>
                    {/* Menu Icon - top right */}
                    <IconButton
                      size="small"
                      onClick={(e) => { setSelectedProjectIndex(index); handleMenuOpen(e); }}
                      sx={{ position: 'absolute', top: 12, right: 12 }}
                    >
                      <MoreVert />
                    </IconButton>
                    {/* Project Name */}
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 1, pr: 4, wordBreak: 'break-word' }}>
                      {project.projectName || project.name || '-'}
                    </Typography>
                    {/* Last Updated */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Last Updated
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 2 }}>
                      {projectStats[project.projectId]?.loading
                        ? '...'
                        : projectStats[project.projectId]?.lastSessionDate || '-'}
                    </Typography>
                    {/* Description */}
                    {project.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {project.description}
                      </Typography>
                    )}
                    {/* Sessions & Artifacts */}
                    <Box display="flex" alignItems="center" gap={3} mt={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarToday fontSize="small" sx={{ color: '#7b7b7b' }} />
                        <Typography variant="body2" color="text.secondary">
                          {projectStats[project.projectId]?.loading ? '...' : projectStats[project.projectId]?.sessions ?? 0} Sessions
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Folder fontSize="small" sx={{ color: '#7b7b7b' }} />
                        <Typography variant="body2" color="text.secondary">
                          {projectStats[project.projectId]?.loading ? '...' : projectStats[project.projectId]?.artifacts ?? 0} Artifacts
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ width: '100%', overflowX: 'auto', mt: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Project Name</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Last Updated</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Sessions</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Artifacts</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Created By</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <tr key={project.projectId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{project.projectName}</td>
                  <td style={{ padding: 8 }}>{new Date(project.updatedAt).toLocaleDateString()}</td>
                  <td style={{ padding: 8 }}>{project.sessions?.length ?? 0}</td>
                  <td style={{ padding: 8 }}>{project.artifacts ?? 0}</td>
                  <td style={{ padding: 8 }}>{project.createdBy ? userMap[project.createdBy as string] || project.createdBy : '-'}</td>
                  <td style={{ padding: 8 }}>
                    <Button size="small" onClick={() => {
                      if (!isValidObjectId(project.projectId)) {
                        alert('Invalid project ID!');
                        return;
                      }
                      router.push(`/projects/${project.projectId}`);
                    }}>View</Button>
                    <Button size="small" onClick={() => { setSelectedProjectIndex(index); setShowEditDialog(true); }}>Edit</Button>
                    <Button size="small" color="error" onClick={() => { setSelectedProjectIndex(index); setShowDeleteDialog(true); }}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {/* Project Menu */}
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
        <MenuItem onClick={() => handleMenuAction('transfer')}>
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          <ListItemText>Transfer Ownership</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('delete')} className="text-red-600">
          <ListItemIcon>
            <Delete fontSize="small" className="text-red-600" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Project Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="mb-3"
          />
          <TextField
            fullWidth
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this project? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={showTransferDialog} onClose={() => setShowTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Project Ownership</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Transfer ownership of this project to another user. The new owner will have full control over the project.
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={transferEmail}
            onChange={(e) => setTransferEmail(e.target.value)}
            placeholder="Enter the email address of the new owner"
            error={!!transferError}
            helperText={transferError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowTransferDialog(false); setTransferEmail(''); setTransferError(''); }}>
            Cancel
          </Button>
          <Button
            onClick={handleTransferConfirm}
            variant="contained"
            disabled={!transferEmail.trim()}
          >
            Transfer Ownership
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Project Modal */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, position: 'relative' }}>
          Create New Project
          <IconButton
            aria-label="close"
            onClick={() => setShowCreateModal(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            type="text"
            fullWidth
            required
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            error={!!newProjectError}
            helperText={newProjectError}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            type="text"
            fullWidth
            value={newProjectDescription}
            onChange={e => setNewProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowCreateModal(false); setNewProjectName(''); setNewProjectDescription(''); setNewProjectError(''); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateProject}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <MemberManagementModal open={showMemberModal} onClose={() => setShowMemberModal(false)} onSend={handleSendInvites} />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
} 