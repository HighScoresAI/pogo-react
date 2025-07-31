"use client";

import React, { useEffect, useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    Avatar,
    IconButton,
    Stack,
    Container,
    Menu,
    MenuItem,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { ApiClient } from "../../lib/api";

export default function LandingPage() {
    const router = useRouter();
    const { logout } = useAuth();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [user, setUser] = useState<{
        firstName: string;
        lastName: string;
        email: string;
        avatar: string;
    }>({
        firstName: '',
        lastName: '',
        email: '',
        avatar: '',
    });
    const [loading, setLoading] = useState(true);

    const open = Boolean(anchorEl);

    useEffect(() => {
        // Fetch user profile data
        console.log('Fetching user profile...');
        ApiClient.getUserProfile()
            .then((data: unknown) => {
                const userData = data as {
                    firstName?: string;
                    lastName?: string;
                    email?: string;
                    avatar?: string;
                };
                console.log('User profile data received:', userData);
                setUser({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    avatar: userData.avatar || '',
                });
            })
            .catch((error) => {
                console.error('Failed to fetch user profile:', error);
                // Fallback to email from token if available
                const token = localStorage.getItem('access_token');
                if (token) {
                    try {
                        const decodedToken: any = JSON.parse(atob(token.split('.')[1]));
                        console.log('Decoded token:', decodedToken);
                        setUser({
                            firstName: decodedToken.firstName || '',
                            lastName: decodedToken.lastName || '',
                            email: decodedToken.email || decodedToken.sub || '',
                            avatar: '',
                        });
                    } catch (e) {
                        console.error('Failed to decode token:', e);
                    }
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleMenuClose();
    };
    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
            {/* Header */}
            <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "#f0f0f0" }}>
                <Toolbar sx={{ justifyContent: "space-between", minHeight: 80 }}>
                    {/* Logo */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <img
                            src="/hellopogo.png"
                            alt="HelloPogo Logo"
                            style={{ height: 40, marginRight: 12 }}
                        />
                    </Box>
                    {/* Nav */}
                    <Stack direction="row" spacing={4} alignItems="center" sx={{ flexGrow: 1, ml: 4 }}>
                        <Typography
                            component={Link}
                            href="/dashboard"
                            variant="body1"
                            sx={{ fontWeight: 700, color: "#222", textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        >
                            Dashboard
                        </Typography>
                        <Typography
                            component={Link}
                            href="/preferences"
                            variant="body1"
                            sx={{ color: "#888", textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        >
                            Settings
                        </Typography>
                        {/* Search bar removed */}
                    </Stack>
                    {/* User */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton>
                            <NotificationsNoneIcon sx={{ color: "#888" }} />
                        </IconButton>
                        <Box
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={handleProfileClick}
                        >
                            <Avatar
                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=random`}
                                alt={`${user.firstName} ${user.lastName}`}
                                sx={{ width: 36, height: 36 }}
                            />
                            <Typography variant="body1" sx={{ fontWeight: 500, color: "#222", ml: 1 }}>
                                {loading ? 'Loading...' : `${user.firstName} ${user.lastName}`.trim() || user.email}
                            </Typography>
                            <ArrowDropDownIcon sx={{ color: "#888" }} />
                        </Box>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <MenuItem component={Link} href="/user-profile" onClick={handleMenuClose}>Profile</MenuItem>
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Container maxWidth={false} sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: { xs: 8, md: 12 }, p: 0 }}>
                <Box
                    sx={{
                        width: "1114px",
                        height: "523px",
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: 3,
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Star background effect */}
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            width: "1114px",
                            height: "523px",
                            flexShrink: 0,
                            zIndex: 0,
                            pointerEvents: "none",
                        }}
                    >
                        <img
                            src="/14081587_1920_1080_60fps 2.png"
                            alt="Star Background"
                            style={{
                                width: '1114px',
                                height: '523px',
                                objectFit: 'cover',
                                display: 'block',
                                flexShrink: 0,
                            }}
                        />
                    </Box>
                    <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                        <Typography
                            variant="h3"
                            sx={{
                                color: "#FFF",
                                textAlign: "center",
                                fontFamily: 'Inter, sans-serif',
                                fontSize: 42,
                                fontWeight: 600,
                                lineHeight: 'normal',
                                fontStyle: 'normal',
                                // leadingTrim: 'both', // Not standard CSS
                                // textEdge: 'cap', // Not standard CSS
                                mb: 3,
                            }}
                        >
                            Welcome to Hello Pogo!<br />Let’s create your first guide
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => router.push('/dashboard')}
                                sx={{
                                    bgcolor: "#00AAF8",
                                    color: "#fff",
                                    fontWeight: 500,
                                    fontSize: 16,
                                    borderRadius: "8px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: "15px",
                                    padding: "10px 20px",
                                    minWidth: 0,
                                    minHeight: 0,
                                    boxShadow: "none",
                                    textTransform: "none",
                                    '&:hover': { bgcolor: "#0095d5" },
                                }}
                            >
                                Let&apos;s build your first workspace
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
} 