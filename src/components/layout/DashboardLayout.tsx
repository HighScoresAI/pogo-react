'use client';

import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Modal,
    Button as MuiButton,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Folder as FolderIcon,
    VideoCall as VideoCallIcon,
    Archive as ArchiveIcon,
    Settings as SettingsIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    AccountCircle as AccountCircleIcon,
    Notifications as NotificationsIcon,
    HelpOutline as HelpOutlineIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { ApiClient } from '../../lib/api';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import Header from './Header';

const drawerWidth = 240;

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const router = useRouter();
    const { logout, userId } = useAuth();
    const [showWelcome, setShowWelcome] = useState(false);
    const [user, setUser] = useState<any>({
        name: '',
        role: '',
        avatar: '',
    });
    const [notificationCount, setNotificationCount] = useState<number>(0);

    useEffect(() => {
        // Fetch user profile
        ApiClient.getUserProfile()
            .then((data: any) => {
                setUser({
                    name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                    role: data.role || data.jobTitle || '',
                    avatar: data.avatar || '',
                });
            })
            .catch(() => {
                setUser({ name: '', role: '', avatar: '' });
            });
        // Fetch notification count (placeholder, set to 0 or fetch from API if available)
        setNotificationCount(0); // TODO: Replace with real count when endpoint is available
    }, [userId]);

    useEffect(() => {
        // Only show on first login (localStorage flag)
        if (typeof window !== 'undefined' && localStorage.getItem('showed_welcome') !== 'true') {
            ApiClient.get('/users/user')
                .then(() => {
                    setShowWelcome(true);
                })
                .catch(() => { });
        }
    }, []);

    useEffect(() => {
        const dismissed = localStorage.getItem('welcomeDismissed');
        if (dismissed !== 'true') {
            setShowWelcome(true);
        }
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleProfileMenuClose();
    };

    const handleCloseWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem('welcomeDismissed', 'true');
    };

    const handleStartTour = () => {
        const tour = new Shepherd.Tour({
            defaultStepOptions: {
                scrollTo: true,
                cancelIcon: { enabled: true },
                classes: 'shepherd-theme-arrows',
            },
        });
        tour.addStep({
            title: 'Projects List',
            text: 'Here you can see all your projects.',
            attachTo: { element: '.projects-list', on: 'bottom' },
            buttons: [{ text: 'Next', action: tour.next }],
        });
        tour.addStep({
            title: 'Project Details',
            text: 'Click a project to view its details.',
            attachTo: { element: '.project-detail', on: 'bottom' },
            buttons: [{ text: 'Next', action: tour.next }],
        });
        tour.addStep({
            title: 'Sessions',
            text: 'Sessions are where you capture documentation.',
            attachTo: { element: '.sessions-list', on: 'bottom' },
            buttons: [{ text: 'Next', action: tour.next }],
        });
        tour.addStep({
            title: 'Artifacts',
            text: 'Artifacts are audio, images, and other captured items.',
            attachTo: { element: '.artifacts-list', on: 'bottom' },
            buttons: [{ text: 'Next', action: tour.next }],
        });
        tour.addStep({
            title: 'Processing',
            text: 'Artifacts are processed to extract useful information.',
            attachTo: { element: '.processing-section', on: 'bottom' },
            buttons: [{ text: 'Done', action: tour.complete }],
        });
        tour.start();
    };

    // Helper to get initials from name
    const getInitials = (name: string) => {
        if (!name) return '';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0][0];
        return parts[0][0] + parts[parts.length - 1][0];
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Projects', icon: <FolderIcon />, path: '/projects' },
        { text: 'Sessions', icon: <VideoCallIcon />, path: '/sessions' },
        // { text: 'Artifacts', icon: <ArchiveIcon />, path: '/artifacts' },
    ];

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Pogo
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton onClick={() => router.push(item.path)}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => router.push('/preferences')}>
                        <ListItemIcon><SettingsIcon /></ListItemIcon>
                        <ListItemText primary="Preferences" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => router.push('/user-profile')}>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText primary="Profile" />
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );

    return (
        <>
            <Header />
            {children}
        </>
    );
} 