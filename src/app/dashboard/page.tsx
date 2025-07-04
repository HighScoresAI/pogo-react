'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useMockData } from '../../hooks/useMockData';
import { Project } from '../../types/project';
import { Session } from '../../types/session';
import { Artifact } from '../../types/artifact';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Folder as FolderIcon,
  VideoCall as VideoCallIcon,
  Archive as ArchiveIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export default function DashboardPage() {
  const { getProjects, getSessions, getArtifacts, loading } = useMockData();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalSessions: 0,
    totalArtifacts: 0,
    totalTeamMembers: 4,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, sessionsData, artifactsData] = await Promise.all([
          getProjects(),
          getSessions(),
          getArtifacts(),
        ]);
        
        setProjects(projectsData);
        setSessions(sessionsData);
        setArtifacts(artifactsData);
        
        setStats({
          totalProjects: projectsData.length,
          totalSessions: sessionsData.length,
          totalArtifacts: artifactsData.length,
          totalTeamMembers: 4,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [getProjects, getSessions, getArtifacts]);

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const ProjectCard = ({ project }: { project: Project }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" component="div" gutterBottom>
                {project.projectName}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {project.description}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip label={`${project.artifacts} artifacts`} size="small" />
                <Chip label={project.role} size="small" color="primary" />
              </Box>
            </Box>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <VisibilityIcon fontSize="small" />
              </ListItemIcon>
              View
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Edit
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              Delete
            </MenuItem>
          </Menu>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading dashboard...</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Projects"
              value={stats.totalProjects}
              icon={<FolderIcon sx={{ color: 'white' }} />}
              color="#9155FD"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Sessions"
              value={stats.totalSessions}
              icon={<VideoCallIcon sx={{ color: 'white' }} />}
              color="#56CA00"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Artifacts"
              value={stats.totalArtifacts}
              icon={<ArchiveIcon sx={{ color: 'white' }} />}
              color="#FFB400"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Team Members"
              value={stats.totalTeamMembers}
              icon={<PeopleIcon sx={{ color: 'white' }} />}
              color="#FF4C51"
            />
          </Grid>
        </Grid>

        {/* Recent Projects */}
        <Typography variant="h5" gutterBottom>
          Recent Projects
        </Typography>
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} key={project.projectId}>
              <ProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </DashboardLayout>
  );
} 