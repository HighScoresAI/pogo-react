'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Project } from '../../types/project';
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';

import {
  Add as AddIcon,
} from '@mui/icons-material';
import { ApiClient } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  // --- Placeholder data ---
  // Place these images in your public/ directory:
  // public/purple-bg.jpg, public/workspace1.jpg, public/workspace2.jpg
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentWorkspace, setRecentWorkspace] = useState<Project | null>(null);
  const [otherWorkspaces, setOtherWorkspaces] = useState<Project[]>([]);
  const [moreWorkspaces, setMoreWorkspaces] = useState<Project[][]>([]); // Array of rows, each row is array of 2 projects
  const [stats, setStats] = useState([
    { icon: <Box component="img" src="/Frame (2).svg" alt="Sessions" sx={{ width: 32, height: 32 }} />, label: 'Sessions', value: 0 },
    { icon: <Box component="img" src="/Frame (1).svg" alt="Audio" sx={{ width: 32, height: 32 }} />, label: 'Audio', value: 0 },
    { icon: <Box component="img" src="/Frame.svg" alt="Images" sx={{ width: 32, height: 32 }} />, label: 'Images', value: 0 },
  ]);
  const [filesProcessed, setFilesProcessed] = useState([
    { label: 'Sessions', value: 0 },
    { label: 'Audio', value: 0 },
    { label: 'Images', value: 0 },
  ]);

  // Add state for create project dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { logout } = useAuth(); // Only use logout, don't wait for auth context

  useEffect(() => {
    // Get userId from token directly (same as welcome page)
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decodedToken: any = JSON.parse(atob(token.split('.')[1]));
      const userId = decodedToken.sub;

      if (!userId) {
        router.push('/login');
        return;
      }

      // Fetch projects directly
      const fetchProjects = async () => {
        try {
          const data = await ApiClient.get<Project[]>(`/users/${userId}/projects`);
          // Sort by updatedAt (most recent first)
          const sorted = [...(data || [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setProjects(sorted);
          setRecentWorkspace(sorted[0] || null);
          setOtherWorkspaces(sorted.slice(1, 3));
          // Group remaining projects into rows of 2
          const more = [];
          for (let i = 3; i < sorted.length; i += 2) {
            more.push(sorted.slice(i, i + 2));
          }
          setMoreWorkspaces(more);
        } catch (error) {
          console.error('Error fetching projects:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProjects();
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    async function fetchStats() {
      if (!recentWorkspace?.projectId) {
        setStats([
          { icon: <Box component="img" src="/Frame (2).svg" alt="Sessions" sx={{ width: 32, height: 32 }} />, label: 'Sessions', value: 0 },
          { icon: <Box component="img" src="/Frame (1).svg" alt="Audio" sx={{ width: 32, height: 32 }} />, label: 'Audio', value: 0 },
          { icon: <Box component="img" src="/Frame.svg" alt="Images" sx={{ width: 32, height: 32 }} />, label: 'Images', value: 0 },
        ]);
        setFilesProcessed([
          { label: 'Sessions', value: 0 },
          { label: 'Audio', value: 0 },
          { label: 'Images', value: 0 },
        ]);
        return;
      }

      try {
        // Get basic stats
        const sessions = await ApiClient.get<{ artifacts?: Array<{ captureType: string }> }[]>(`/projects/${recentWorkspace.projectId}/sessions`);
        let audioCount = 0;
        let imageCount = 0;

        sessions.forEach(session => {
          if (Array.isArray(session.artifacts)) {
            audioCount += session.artifacts.filter((a: { captureType: string }) => a.captureType === 'audio').length;
            imageCount += session.artifacts.filter((a: { captureType: string }) => a.captureType === 'screenshot' || a.captureType === 'image').length;
          }
        });

        // Get processing statistics from backend
        console.log('Frontend: Fetching processing stats for project:', recentWorkspace.projectId);
        const processingStats = await ApiClient.get<{ sessions?: { percentage: number }, audio?: { percentage: number }, images?: { percentage: number } }>(`/projects/${recentWorkspace.projectId}/processing-stats`);
        console.log('Frontend: Received processing stats:', processingStats);

        setStats([
          { icon: <Box component="img" src="/Frame (2).svg" alt="Sessions" sx={{ width: 32, height: 32 }} />, label: 'Sessions', value: sessions.length },
          { icon: <Box component="img" src="/Frame (1).svg" alt="Audio" sx={{ width: 32, height: 32 }} />, label: 'Audio', value: audioCount },
          { icon: <Box component="img" src="/Frame.svg" alt="Images" sx={{ width: 32, height: 32 }} />, label: 'Images', value: imageCount },
        ]);

        setFilesProcessed([
          { label: 'Sessions', value: processingStats.sessions?.percentage || 0 },
          { label: 'Audio', value: processingStats.audio?.percentage || 0 },
          { label: 'Images', value: processingStats.images?.percentage || 0 },
        ]);
      } catch (error) {
        console.error('Frontend: Error fetching stats:', error);
        setStats([
          { icon: <Box component="img" src="/Frame (2).svg" alt="Sessions" sx={{ width: 32, height: 32 }} />, label: 'Sessions', value: 0 },
          { icon: <Box component="img" src="/Frame (1).svg" alt="Audio" sx={{ width: 32, height: 32 }} />, label: 'Audio', value: 0 },
          { icon: <Box component="img" src="/Frame.svg" alt="Images" sx={{ width: 32, height: 32 }} />, label: 'Images', value: 0 },
        ]);
        setFilesProcessed([
          { label: 'Sessions', value: 0 },
          { label: 'Audio', value: 0 },
          { label: 'Images', value: 0 },
        ]);
      }
    }

    // Always fetch stats when recentWorkspace changes, regardless of current stats values
    if (recentWorkspace?.projectId) {
      fetchStats();
    }
  }, [recentWorkspace?.projectId]); // Remove stats dependency to always update when workspace changes

  // Show loading state only briefly while fetching data
  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ background: 'white', minHeight: '100vh', p: { xs: 2, sm: 4 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 6 }, py: 0 }}>
          {/* Recent workspace heading and create button */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent workspace
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: '#00AAF8',
                color: '#fff',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontSize: 16,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#0095d5' },
              }}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create new workspace
            </Button>
          </Box>
          {recentWorkspace && (
            <Box
              sx={{
                width: '1114px',
                height: '296px',
                flexShrink: 0,
                borderRadius: 4,
                overflow: 'hidden',
                mb: 3,
                boxShadow: 3,
                position: 'relative',
                background: `url(${(recentWorkspace as any)?.bg || '/purple-bg.png'}) center/cover no-repeat`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 3,
                  py: 2.5,
                  background: 'rgba(24,24,32,0.3)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  color: '#fff',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 20, mb: 0.5, lineHeight: 1.2 }}>
                    {`Workspace ${recentWorkspace.projectName || (recentWorkspace as any)?.name || ''}`}
                  </Typography>
                  <Typography sx={{ fontSize: 14, opacity: 0.85, fontWeight: 400 }}>
                    {recentWorkspace.updatedAt ? `Last updated: ${new Date(recentWorkspace.updatedAt).toLocaleDateString()}` : ''}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: '#00AAF8',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontSize: 16,
                    boxShadow: 'none',
                    ml: 2,
                    '&:hover': { bgcolor: '#0095d5' },
                  }}
                  onClick={() => router.push(`/projects/${recentWorkspace.projectId}`)}
                >
                  Go to Workspace
                </Button>
              </Box>
            </Box>
          )}
          {/* Stats cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            {stats.map((stat) => (
              <Box key={stat.label} sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <Card sx={{ borderRadius: 3, boxShadow: 1, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ bgcolor: '#CBF0BC', borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#888', fontWeight: 500 }}>{stat.label}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
          {/* Files processed section */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Files processed
          </Typography>
          <Box sx={{ mb: 4 }}>
            {filesProcessed.map((item) => (
              <Box key={item.label} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.value}%</Typography>
                </Box>
                <Box sx={{ width: '100%', height: 8, bgcolor: '#F5F6FA', borderRadius: 4, overflow: 'hidden' }}>
                  <Box sx={{ width: `${item.value}%`, height: '100%', bgcolor: '#56CA00', borderRadius: 4 }} />
                </Box>
              </Box>
            ))}
          </Box>
          {/* Other workspaces */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Other workspaces
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'nowrap', mt: 2 }}>
            {otherWorkspaces.map((ws, idx) => (
              <Box
                key={ws.projectId || idx}
                sx={{
                  width: '547px',
                  height: '296px',
                  flexShrink: 0,
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: 2,
                  background: `url(${(ws as any)?.bg || '/workspace.jpg'}) center/cover no-repeat`,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 6 },
                }}
                onClick={() => {
                  // Swap logic
                  setOtherWorkspaces(prev => {
                    const newOthers = [...prev];
                    if (recentWorkspace) {
                      newOthers[idx] = recentWorkspace;
                    }
                    return newOthers.map((item, i) => i === idx && recentWorkspace ? recentWorkspace : item);
                  });
                  setRecentWorkspace(ws);
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    py: 2.5,
                    background: 'rgba(24,24,32,0.3)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: '#fff',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 20, mb: 0.5, lineHeight: 1.2 }}>
                      {`Project ${ws.projectName || (ws as any)?.name || ''}`}
                    </Typography>
                    <Typography sx={{ fontSize: 14, opacity: 0.85, fontWeight: 400 }}>
                      {ws.updatedAt ? `Last updated: ${new Date(ws.updatedAt).toLocaleDateString()}` : ''}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: '#00AAF8',
                      color: '#fff',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontSize: 16,
                      boxShadow: 'none',
                      ml: 2,
                      '&:hover': { bgcolor: '#0095d5' },
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      router.push(`/projects/${ws.projectId}`);
                    }}
                  >
                    Go to Workspace
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
          {/* More workspaces in rows of 2 */}
          {moreWorkspaces.map((row, rowIdx) => (
            <Box key={rowIdx} sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'nowrap', mt: 2 }}>
              {row.map((ws, idx) => (
                <Box
                  key={ws.projectId || idx}
                  sx={{
                    width: '547px',
                    height: '296px',
                    flexShrink: 0,
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: 2,
                    background: `url(${(ws as any)?.bg || '/workspace.jpg'}) center/cover no-repeat`,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: 6 },
                  }}
                  onClick={() => {
                    // Swap logic
                    setOtherWorkspaces(prev => {
                      const newOthers = [...prev];
                      if (recentWorkspace) {
                        newOthers[0] = recentWorkspace;
                      }
                      return newOthers.map((item, i) => i === 0 && recentWorkspace ? recentWorkspace : item);
                    });
                    setRecentWorkspace(ws);
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 3,
                      py: 2.5,
                      background: 'rgba(24,24,32,0.3)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      color: '#fff',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 20, mb: 0.5, lineHeight: 1.2 }}>
                        {`Project ${ws.projectName || (ws as any)?.name || ''}`}
                      </Typography>
                      <Typography sx={{ fontSize: 14, opacity: 0.85, fontWeight: 400 }}>
                        {ws.updatedAt ? `Last updated: ${new Date(ws.updatedAt).toLocaleDateString()}` : ''}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: '#00AAF8',
                        color: '#fff',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontSize: 16,
                        boxShadow: 'none',
                        ml: 2,
                        '&:hover': { bgcolor: '#0095d5' },
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        router.push(`/projects/${ws.projectId}`);
                      }}
                    >
                      Go to Workspace
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Container>
      </Box>

      {/* Create new workspace dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 3,
            minWidth: 400,
            maxWidth: 500,
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 600,
          fontSize: 20,
          pb: 2,
          pt: 3,
          px: 3,
          borderBottom: '1px solid #f0f0f0'
        }}>
          Create New Workspace
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          <TextField
            autoFocus
            label="Workspace Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Enter workspace name"
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                height: 56,
                '& fieldset': {
                  borderColor: '#e0e0e0',
                  borderWidth: 1,
                },
                '&:hover fieldset': {
                  borderColor: '#00AAF8',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00AAF8',
                  borderWidth: 2,
                },
                '& input': {
                  padding: '16px 14px',
                  fontSize: 16,
                  color: '#333',
                  '&::placeholder': {
                    color: '#999',
                    opacity: 1,
                  },
                },
              },
              '& .MuiInputLabel-root': {
                color: '#666',
                fontSize: 16,
                '&.Mui-focused': {
                  color: '#00AAF8',
                },
                '&.Mui-shrink': {
                  color: '#666',
                },
              },
              '& .MuiFormHelperText-root': {
                display: 'none',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            sx={{
              color: '#666',
              fontWeight: 500,
              textTransform: 'none',
              fontSize: 16,
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setCreatingProject(true);
              try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                  throw new Error('No token found');
                }
                const decodedToken: any = JSON.parse(atob(token.split('.')[1]));
                const userId = decodedToken.sub;

                if (!userId) {
                  throw new Error('No user ID found');
                }
                await ApiClient.post('/projects', { name: newProjectName, createdBy: userId });
                setCreateDialogOpen(false);
                setNewProjectName('');
                // Refresh projects list to include the new one
                const data = await ApiClient.get<Project[]>(`/users/${userId}/projects`);
                const sorted = [...(data || [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setProjects(sorted);
                setRecentWorkspace(sorted[0] || null);
                setOtherWorkspaces(sorted.slice(1, 3));
                const more = [];
                for (let i = 3; i < sorted.length; i += 2) {
                  more.push(sorted.slice(i, i + 2));
                }
                setMoreWorkspaces(more);
              } catch (error) {
                console.error('Error creating project:', error);
                alert('Failed to create workspace. Please try again.');
              } finally {
                setCreatingProject(false);
              }
            }}
            disabled={creatingProject || !newProjectName}
            variant="contained"
            sx={{
              bgcolor: newProjectName ? '#00AAF8' : '#e0e0e0',
              color: newProjectName ? '#fff' : '#999',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontSize: 16,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: newProjectName ? '#0095d5' : '#e0e0e0',
              },
              '&:disabled': {
                bgcolor: '#e0e0e0',
                color: '#999',
              },
            }}
          >
            {creatingProject ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
} 