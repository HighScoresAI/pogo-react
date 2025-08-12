import React, { useEffect, useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Avatar,
    IconButton,
    Stack,
    Menu,
    MenuItem,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArticleIcon from "@mui/icons-material/Article";
import Link from "next/link";
import { ApiClient } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function Header() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [user, setUser] = useState<{ firstName: string; avatar?: string }>({ firstName: "", avatar: undefined });
    const router = useRouter();

    useEffect(() => {
        ApiClient.get('/users/user').then((data: any) => {
            setUser({
                firstName: data.firstName || (data.name ? data.name.split(' ')[0] : 'User'),
                avatar: data.avatar || undefined,
            });
        }).catch(() => {
            setUser({ firstName: "User", avatar: undefined });
        });
    }, []);

    const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    const handleLogout = () => {
        // Remove token from localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
        // Optionally clear cookies/session here
        handleMenuClose();
        // Redirect to login page
        router.push('/login');
    };
    // Helper to get first initial from first name
    const getInitial = (firstName: string) => {
        return firstName ? firstName[0].toUpperCase() : '';
    };
    return (
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
                        href="/blog"
                        variant="body1"
                        sx={{ color: "#888", textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    >
                        Blog
                    </Typography>

                    <Typography
                        component={Link}
                        href="/preferences"
                        variant="body1"
                        sx={{ color: "#888", textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    >
                        Settings
                    </Typography>
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
                            src={user.avatar}
                            alt={user.firstName}
                            sx={{ width: 36, height: 36, bgcolor: !user.avatar ? '#0095D5' : undefined }}
                        >
                            {!user.avatar && getInitial(user.firstName)}
                        </Avatar>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: "#222", ml: 1 }}>
                            {user.firstName}
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
    );
} 