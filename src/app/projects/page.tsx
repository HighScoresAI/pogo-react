'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
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
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Edit,
  PersonAdd,
  Delete,
  CalendarToday,
  Description,
  Folder,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface Project {
  projectId: string;
  projectName: string;
  description?: string;
  role: string;
  sessions: any[];
  artifacts: number;
  updatedAt: string;
  bgClass: string;
  iconClass: string;
  badgeClass: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const router = useRouter();
  const { getUserId } = useAuth();

  // Mock data for demonstration
  const mockProjects: Project[] = [
    {
      projectId: '1',
      projectName: 'E-commerce Platform',
      description: 'A modern e-commerce platform with advanced features',
      role: 'Owner',
      sessions: [{}, {}, {}],
      artifacts: 15,
      updatedAt: '2024-01-15',
      bgClass: 'bg-primary',
      iconClass: 'bi-cart',
      badgeClass: 'badge-success',
    },
    {
      projectId: '2',
      projectName: 'Mobile App Development',
      description: 'Cross-platform mobile application',
      role: 'Member',
      sessions: [{}, {}],
      artifacts: 8,
      updatedAt: '2024-01-10',
      bgClass: 'bg-success',
      iconClass: 'bi-phone',
      badgeClass: 'badge-info',
    },
    {
      projectId: '3',
      projectName: 'Data Analytics Dashboard',
      description: 'Real-time analytics and reporting system',
      role: 'Admin',
      sessions: [{}, {}, {}, {}],
      artifacts: 22,
      updatedAt: '2024-01-12',
      bgClass: 'bg-warning',
      iconClass: 'bi-graph-up',
      badgeClass: 'badge-warning',
    },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await ApiClient.get('/projects');
      // setProjects(response);
      
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProjects(mockProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedProjectIndex(index);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProjectIndex(null);
  };

  const handleMenuAction = (action: string) => {
    if (selectedProjectIndex === null) return;

    const project = projects[selectedProjectIndex];

    switch (action) {
      case 'view':
        router.push(`/project-detail?project=${project.projectId}`);
        break;
      case 'edit':
        setEditForm({
          name: project.projectName,
          description: project.description || '',
        });
        setShowEditDialog(true);
        break;
      case 'transfer':
        // TODO: Implement transfer ownership
        console.log('Transfer ownership for project:', project.projectId);
        break;
      case 'delete':
        setShowDeleteDialog(true);
        break;
    }

    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (selectedProjectIndex === null) return;

    try {
      // TODO: Replace with actual API call
      // await ApiClient.put(`/projects/${projects[selectedProjectIndex].projectId}`, editForm);
      
      // Update local state
      const updatedProjects = [...projects];
      updatedProjects[selectedProjectIndex] = {
        ...updatedProjects[selectedProjectIndex],
        projectName: editForm.name,
        description: editForm.description,
      };
      setProjects(updatedProjects);
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedProjectIndex === null) return;

    try {
      // TODO: Replace with actual API call
      // await ApiClient.delete(`/projects/${projects[selectedProjectIndex].projectId}`);
      
      // Remove from local state
      const updatedProjects = projects.filter((_, index) => index !== selectedProjectIndex);
      setProjects(updatedProjects);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'success';
      case 'admin':
        return 'warning';
      case 'member':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" className="mb-6">
        Projects
      </Typography>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {projects.map((project, index) => (
          <Grid item xs={12} md={6} lg={4} key={project.projectId}>
            <Card className="h-full">
              <CardContent>
                <Box className="flex justify-between items-start mb-3">
                  <Box className="flex items-center">
                    <Box className={`p-2 rounded ${project.bgClass} text-white mr-3`}>
                      <CalendarToday fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, index)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography variant="h6" className="mb-2">
                  {project.projectName}
                </Typography>

                {project.description && (
                  <Typography variant="body2" color="textSecondary" className="mb-3">
                    {project.description}
                  </Typography>
                )}

                <Box className="flex justify-between items-center mb-3">
                  <Chip
                    label={project.role}
                    color={getRoleColor(project.role) as any}
                    size="small"
                  />
                  <Box className="flex items-center space-x-3 text-sm text-gray-600">
                    <Box className="flex items-center">
                      <CalendarToday fontSize="small" className="mr-1" />
                      {project.sessions.length} Sessions
                    </Box>
                    <Box className="flex items-center">
                      <Folder fontSize="small" className="mr-1" />
                      {project.artifacts} Artifacts
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
    </Container>
  );
} 