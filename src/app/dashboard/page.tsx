'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useApiData } from '../../hooks/useApiData';
import { Project } from '../../types/project';
import { Session } from '../../types/session';
import { Artifact } from '../../types/artifact';
import {
  Box,
  Container,
  Typography,
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
  Folder as FolderIcon,
  VideoCall as VideoCallIcon,
  Archive as ArchiveIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Add as AddIcon,
  InsertDriveFileOutlined as InsertDriveFileOutlinedIcon,
  AudiotrackOutlined as AudiotrackOutlinedIcon,
  ImageOutlined as ImageOutlinedIcon,
} from '@mui/icons-material';
import { ApiClient } from '../../lib/api';
import ChatbotWidget from '../../components/ChatbotWidget';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  // --- Placeholder data ---
  // Place these images in your public/ directory:
  // public/purple-bg.jpg, public/workspace1.jpg, public/workspace2.jpg
  const [projects, setProjects] = useState<any[]>([]);
  const [recentWorkspace, setRecentWorkspace] = useState<any | null>(null);
  const [otherWorkspaces, setOtherWorkspaces] = useState<any[]>([]);
  const [moreWorkspaces, setMoreWorkspaces] = useState<any[][]>([]); // Array of rows, each row is array of 2 projects
  const [stats, setStats] = useState([
    { icon: <Box component="img" src="/frame (2).svg" alt="Sessions" sx={{ width: 32, height: 32 }} />, label: 'Sessions', value: 0 },
    { icon: <Box component="img" src="/frame (1).svg" alt="Audio" sx={{ width: 32, height: 32 }} />, label: 'Audio', value: 0 },
    { icon: <Box component="img" src="/frame.svg" alt="Images" sx={{ width: 32, height: 32 }} />, label: 'Images', value: 0 },
  ]);
  const filesProcessed = [
    { label: 'Sessions', value: 80 },
    { label: 'Audio', value: 65 },
    { label: 'Images', value: 55 },
  ];

  useEffect(() => {
    ApiClient.get<Project[]>('/projects').then((data) => {
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
    });
  }, []);

  useEffect(() => {
    async function fetchStats() {
      if (!recentWorkspace?.projectId) {
        setStats([
          { icon: <Box component="img" src="/frame (2).svg" alt="Sessions" sx={{ width: 32, height: 32 }} />, label: 'Sessions', value: 0 },
          { icon: <Box component="img" src="/frame (1).svg" alt="Audio" sx={{ width: 32, height: 32 }} />, label: 'Audio', value: 0 },
          { icon: <Box component="img" src="/frame.svg" alt="Images" sx={{ width: 32, height: 32 }} />, label: 'Images', value: 0 },
        ]);
        return;
      }
      try {
        const sessions = await ApiClient.get<any[]>(`/projects/${recentWorkspace.projectId}/sessions`);
        let audioCount = 0;
        let imageCount = 0;
        sessions.forEach(session => {
          if (Array.isArray(session.artifacts)) {
            audioCount += session.artifacts.filter((a: any) => a.captureType === 'audio').length;
            imageCount += session.artifacts.filter((a: any) => a.captureType === 'screenshot' || a.captureType === 'image').length;
          }
        });
        setStats([
          { icon: <Box component="img" src="/frame (2).svg" alt="Sessions" sx={{ width: 32, height: 32 }} />, label: 'Sessions', value: sessions.length },
          { icon: <Box component="img" src="/frame (1).svg" alt="Audio" sx={{ width: 32, height: 32 }} />, label: 'Audio', value: audioCount },
          { icon: <Box component="img" src="/frame.svg" alt="Images" sx={{ width: 32, height: 32 }} />, label: 'Images', value: imageCount },
        ]);
      } catch {
        setStats([
          { icon: <Box component="img" src="/frame (2).svg" alt="Sessions" sx={{ width: 32, height: 32 }} />, label: 'Sessions', value: 0 },
          { icon: <Box component="img" src="/frame (1).svg" alt="Audio" sx={{ width: 32, height: 32 }} />, label: 'Audio', value: 0 },
          { icon: <Box component="img" src="/frame.svg" alt="Images" sx={{ width: 32, height: 32 }} />, label: 'Images', value: 0 },
        ]);
      }
    }
    fetchStats();
  }, [recentWorkspace]);

  const router = useRouter();

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
                background: `url(${recentWorkspace.bg || '/purple-bg.png'}) center/cover no-repeat`,
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
                    {`Workspace ${recentWorkspace.projectName || recentWorkspace.name || ''}`}
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
            {stats.map((stat, idx) => (
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
            {filesProcessed.map((item, idx) => (
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
                  background: `url(${ws.bg || '/workspace.jpg'}) center/cover no-repeat`,
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
                    newOthers[idx] = recentWorkspace;
                    return newOthers.map((item, i) => i === idx ? recentWorkspace : item);
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
                      {`Project ${ws.projectName || ws.name || ''}`}
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
                    background: `url(${ws.bg || '/workspace.jpg'}) center/cover no-repeat`,
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
                      newOthers[0] = recentWorkspace;
                      return newOthers.map((item, i) => i === 0 ? recentWorkspace : item);
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
                        {`Project ${ws.projectName || ws.name || ''}`}
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
    </DashboardLayout>
  );
} 