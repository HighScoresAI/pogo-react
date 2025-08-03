'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, FormControlLabel, Switch } from '@mui/material';
import {
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
    Security as SecurityIcon,
    VpnKey as VpnKeyIcon,
    Link as LinkIcon,
} from '@mui/icons-material';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

const SETTINGS_SECTIONS = [
    { key: 'profile', label: 'Profile', icon: <SettingsIcon /> },
    { key: 'notifications', label: 'Notifications', icon: <NotificationsIcon /> },
    { key: 'security', label: 'Security', icon: <SecurityIcon /> },
    { key: 'api', label: 'API Access', icon: <VpnKeyIcon /> },
    { key: 'accounts', label: 'Connected Accounts', icon: <LinkIcon /> },
];

export default function UserProfilePage() {
    const [section, setSection] = useState('profile');
    const { getToken } = useAuth();
    const token = getToken();
    const [user, setUser] = useState({
        name: '',
        email: '',
        jobTitle: '',
        organization: '',
        phone: '',
        location: '',
        bio: '',
    });
    const [notifications, setNotifications] = useState({
        projectUpdates: true,
        sessionReminders: true,
        mentionNotifications: true,
    });
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        weeklyDigest: true,
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    // Security: Change Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [changePwLoading, setChangePwLoading] = useState(false);
    const [changePwError, setChangePwError] = useState('');
    const [changePwSuccess, setChangePwSuccess] = useState('');

    // 2FA state
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [twoFASecret, setTwoFASecret] = useState('');
    const [twoFAUrl, setTwoFAUrl] = useState('');
    const [twoFACode, setTwoFACode] = useState('');
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [twoFAError, setTwoFAError] = useState('');
    const [twoFASuccess, setTwoFASuccess] = useState('');
    const [show2FASetup, setShow2FASetup] = useState(false);

    // Delete Account state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState('');
    const { logout } = useAuth();

    useEffect(() => {
        if (section === 'profile' && token) {
            setProfileLoading(true);
            setProfileError('');
            ApiClient.getUserProfile()
                .then((data: any) => setUser({
                    name: data.name || '',
                    email: data.email || '',
                    jobTitle: data.jobTitle || '',
                    organization: data.organization || '',
                    phone: data.phone || '',
                    location: data.location || '',
                    bio: data.bio || '',
                }))
                .catch(e => setProfileError(e.message))
                .finally(() => setProfileLoading(false));
        }
    }, [section, token]);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Box sx={{ py: 4, display: 'flex', gap: 4 }}>
                {/* Sidebar Navigation */}
                <Box sx={{ minWidth: 220, borderRight: '1px solid #eee', pr: 2 }}>
                    <Typography variant="h5" sx={{ mb: 3 }}>Settings</Typography>
                    {SETTINGS_SECTIONS.map(s => (
                        <Button
                            key={s.key}
                            startIcon={s.icon}
                            variant={section === s.key ? 'contained' : 'text'}
                            color={section === s.key ? 'primary' : 'inherit'}
                            sx={{
                                mb: 1,
                                justifyContent: 'flex-start',
                                width: '100%',
                                fontWeight: section === s.key ? 600 : 400,
                                borderRadius: 2,
                                textTransform: 'none',
                            }}
                            onClick={() => setSection(s.key)}
                        >
                            {s.label}
                        </Button>
                    ))}
                </Box>
                {/* Main Content */}
                <Box sx={{ flex: 1 }}>
                    <>
                        {section === 'profile' && (
                            <Box p={4} bgcolor="#e3f2fd" borderRadius={2}>
                                <Typography variant="h4" color="primary" gutterBottom>Profile</Typography>
                                {profileLoading ? (
                                    <Typography>Loading...</Typography>
                                ) : profileError ? (
                                    <Typography color="error">{profileError}</Typography>
                                ) : (
                                    <Box component="form" sx={{ maxWidth: 600 }}>
                                        <TextField
                                            fullWidth
                                            label="Full Name"
                                            value={user.name}
                                            onChange={e => setUser({ ...user, name: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            type="email"
                                            value={user.email}
                                            onChange={e => setUser({ ...user, email: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Job Title"
                                            value={user.jobTitle}
                                            onChange={e => setUser({ ...user, jobTitle: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Organization"
                                            value={user.organization}
                                            onChange={e => setUser({ ...user, organization: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Phone"
                                            value={user.phone}
                                            onChange={e => setUser({ ...user, phone: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Location"
                                            value={user.location}
                                            onChange={e => setUser({ ...user, location: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Bio"
                                            multiline
                                            rows={3}
                                            value={user.bio}
                                            onChange={e => setUser({ ...user, bio: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />
                                        {profileSuccess && <Typography color="success.main" sx={{ mb: 2 }}>{profileSuccess}</Typography>}
                                        {profileError && <Typography color="error" sx={{ mb: 2 }}>{profileError}</Typography>}
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Button variant="contained" color="primary" onClick={async (e) => {
                                                e.preventDefault();
                                                setProfileError('');
                                                setProfileSuccess('');
                                                try {
                                                    await ApiClient.post('/users/me', user);
                                                    setProfileSuccess('Profile updated successfully!');
                                                } catch (err: any) {
                                                    setProfileError(err.message);
                                                }
                                            }}>Save Profile</Button>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                        {section === 'notifications' && (
                            <Box p={4} bgcolor="#fff3e0" borderRadius={2}>
                                <Typography variant="h4" color="warning.main" gutterBottom>Notifications</Typography>
                                <Typography variant="body1">Notification settings will be available soon.</Typography>
                            </Box>
                        )}
                        {section === 'security' && (
                            <Box p={4} bgcolor="#f3e5f5" borderRadius={2}>
                                <Typography variant="h4" color="error" gutterBottom>Security</Typography>
                                <Box sx={{ maxWidth: 500 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Change Password</Typography>
                                    {changePwError && <Typography color="error" sx={{ mb: 1 }}>{changePwError}</Typography>}
                                    {changePwSuccess && <Typography color="success.main" sx={{ mb: 1 }}>{changePwSuccess}</Typography>}
                                    <TextField
                                        fullWidth
                                        label="Current Password"
                                        type="password"
                                        sx={{ mb: 2 }}
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                    />
                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        type="password"
                                        sx={{ mb: 2 }}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Confirm New Password"
                                        type="password"
                                        sx={{ mb: 2 }}
                                        value={confirmNewPassword}
                                        onChange={e => setConfirmNewPassword(e.target.value)}
                                    />
                                    <Box sx={{ textAlign: 'right', mb: 4 }}>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            disabled={changePwLoading}
                                            onClick={async () => {
                                                setChangePwError('');
                                                setChangePwSuccess('');
                                                if (!currentPassword || !newPassword || !confirmNewPassword) {
                                                    setChangePwError('Please fill in all fields.');
                                                    return;
                                                }
                                                if (newPassword !== confirmNewPassword) {
                                                    setChangePwError('New passwords do not match.');
                                                    return;
                                                }
                                                setChangePwLoading(true);
                                                try {
                                                    const res = await ApiClient.post('/auth/change-password', {
                                                        oldPassword: currentPassword,
                                                        newPassword: newPassword,
                                                    });
                                                    setChangePwSuccess((res as any).message || 'Password changed successfully.');
                                                    setCurrentPassword('');
                                                    setNewPassword('');
                                                    setConfirmNewPassword('');
                                                } catch (err: any) {
                                                    setChangePwError(err.message || 'Failed to change password.');
                                                } finally {
                                                    setChangePwLoading(false);
                                                }
                                            }}
                                        >
                                            {changePwLoading ? 'Changing...' : 'Change Password'}
                                        </Button>
                                    </Box>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Two-Factor Authentication</Typography>
                                    {twoFAError && <Typography color="error" sx={{ mb: 1 }}>{twoFAError}</Typography>}
                                    {twoFASuccess && <Typography color="success.main" sx={{ mb: 1 }}>{twoFASuccess}</Typography>}
                                    {!twoFAEnabled && !show2FASetup && (
                                        <Button variant="outlined" color="primary" onClick={async () => {
                                            setTwoFALoading(true);
                                            setTwoFAError('');
                                            setTwoFASuccess('');
                                            try {
                                                const res: any = await ApiClient.post('/auth/2fa/generate', {});
                                                setTwoFASecret(res.secret);
                                                setTwoFAUrl(res.otpauth_url);
                                                setShow2FASetup(true);
                                            } catch (err: any) {
                                                setTwoFAError('Failed to start 2FA setup.');
                                            } finally {
                                                setTwoFALoading(false);
                                            }
                                        }} disabled={twoFALoading}>
                                            {twoFALoading ? 'Loading...' : 'Enable 2FA'}
                                        </Button>
                                    )}
                                    {show2FASetup && !twoFAEnabled && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography sx={{ mb: 1 }}>Scan this QR code with your authenticator app:</Typography>
                                            {twoFAUrl && <QRCodeCanvas value={twoFAUrl} size={180} />}
                                            <Typography sx={{ mt: 2, mb: 1 }}>Or enter this secret manually:</Typography>
                                            <Box sx={{ fontFamily: 'monospace', bgcolor: '#fff', p: 1, borderRadius: 1, mb: 2 }}>{twoFASecret}</Box>
                                            <TextField
                                                fullWidth
                                                label="Enter 2FA Code"
                                                value={twoFACode}
                                                onChange={e => setTwoFACode(e.target.value)}
                                                sx={{ mb: 2 }}
                                            />
                                            <Button variant="contained" color="primary" onClick={async () => {
                                                setTwoFALoading(true);
                                                setTwoFAError('');
                                                setTwoFASuccess('');
                                                try {
                                                    const res: any = await ApiClient.post('/auth/2fa/enable', { code: twoFACode });
                                                    if (res.message && res.message.toLowerCase().includes('enabled')) {
                                                        setTwoFASuccess('2FA enabled!');
                                                        setTwoFAEnabled(true);
                                                        setShow2FASetup(false);
                                                    } else {
                                                        setTwoFAError(res.error || 'Invalid code.');
                                                    }
                                                } catch (err: any) {
                                                    setTwoFAError('Failed to enable 2FA.');
                                                } finally {
                                                    setTwoFALoading(false);
                                                }
                                            }} disabled={twoFALoading}>
                                                {twoFALoading ? 'Enabling...' : 'Verify & Enable 2FA'}
                                            </Button>
                                        </Box>
                                    )}
                                    {twoFAEnabled && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography sx={{ mb: 1 }}>Two-Factor Authentication is <b>enabled</b> on your account.</Typography>
                                            <Button variant="outlined" color="error" onClick={async () => {
                                                setTwoFALoading(true);
                                                setTwoFAError('');
                                                setTwoFASuccess('');
                                                try {
                                                    const res: any = await ApiClient.post('/auth/2fa/disable', {});
                                                    if (res.message && res.message.toLowerCase().includes('disabled')) {
                                                        setTwoFASuccess('2FA disabled.');
                                                        setTwoFAEnabled(false);
                                                    } else {
                                                        setTwoFAError(res.error || 'Failed to disable 2FA.');
                                                    }
                                                } catch (err: any) {
                                                    setTwoFAError('Failed to disable 2FA.');
                                                } finally {
                                                    setTwoFALoading(false);
                                                }
                                            }} disabled={twoFALoading}>
                                                {twoFALoading ? 'Disabling...' : 'Disable 2FA'}
                                            </Button>
                                        </Box>
                                    )}
                                    <Typography variant="h6" sx={{ mb: 2 }}>Sessions</Typography>
                                    <Typography variant="body2" color="text.secondary">Session management will be available soon.</Typography>
                                    <Typography variant="h6" sx={{ mb: 2 }}>Delete Account</Typography>
                                    {deleteError && <Typography color="error" sx={{ mb: 1 }}>{deleteError}</Typography>}
                                    {deleteSuccess && <Typography color="success.main" sx={{ mb: 1 }}>{deleteSuccess}</Typography>}
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        disabled={deleteLoading}
                                    >
                                        Delete Account
                                    </Button>
                                    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                                        <DialogTitle>Confirm Account Deletion</DialogTitle>
                                        <DialogContent>
                                            <DialogContentText>
                                                Are you sure you want to delete your account? This action cannot be undone.
                                            </DialogContentText>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>Cancel</Button>
                                            <Button
                                                onClick={async () => {
                                                    setDeleteLoading(true);
                                                    setDeleteError('');
                                                    setDeleteSuccess('');
                                                    try {
                                                        const res: any = await ApiClient.delete('/auth/delete-account');
                                                        setDeleteSuccess(res.message || 'Account deleted.');
                                                        setTimeout(() => {
                                                            logout();
                                                            window.location.href = '/';
                                                        }, 1500);
                                                    } catch (err: any) {
                                                        setDeleteError(err.message || 'Failed to delete account.');
                                                    } finally {
                                                        setDeleteLoading(false);
                                                        setDeleteDialogOpen(false);
                                                    }
                                                }}
                                                color="error"
                                                variant="contained"
                                                disabled={deleteLoading}
                                            >
                                                {deleteLoading ? 'Deleting...' : 'Delete'}
                                            </Button>
                                        </DialogActions>
                                    </Dialog>
                                </Box>
                            </Box>
                        )}
                        {section === 'api' && (
                            <Box p={4} bgcolor="#e8f5e9" borderRadius={2}>
                                <ApiAccessSection />
                            </Box>
                        )}
                        {section === 'accounts' && (
                            <Box p={4} bgcolor="#f3e5f5" borderRadius={2}>
                                <Typography variant="h4" color="primary" gutterBottom>Connected Accounts</Typography>
                                <ConnectedAccountsSection />
                                <ExtensionManagementSection />
                            </Box>
                        )}
                    </>
                </Box>
            </Box>
        </div>
    );
} 