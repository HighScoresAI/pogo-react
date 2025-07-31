import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, IconButton, Divider, TextField, CircularProgress, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ExtensionManagementSection() {
    const [devices, setDevices] = useState<any[]>([]);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [settingKey, setSettingKey] = useState('');
    const [settingValue, setSettingValue] = useState('');

    // Fetch devices and settings on mount
    useEffect(() => {
        fetchDevices();
        fetchSettings();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/extension/devices');
            const data = await res.json();
            setDevices(data.devices || []);
        } catch (e) {
            setError('Failed to load devices');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/extension/settings');
            const data = await res.json();
            setSettings(data.settings || {});
        } catch (e) {
            // ignore
        }
    };

    const handleRevoke = async (token: string) => {
        if (!window.confirm('Revoke this extension?')) return;
        try {
            await fetch(`/api/extension/devices/${token}`, { method: 'DELETE' });
            setDevices(devices.filter(d => d.token !== token));
        } catch (e) {
            setError('Failed to revoke extension');
        }
    };

    const handleSettingSave = async () => {
        if (!settingKey) return;
        setSaving(true);
        try {
            await fetch('/api/extension/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: settingKey, value: settingValue })
            });
            setSettings({ ...settings, [settingKey]: settingValue });
            setSettingKey('');
            setSettingValue('');
        } catch (e) {
            setError('Failed to save setting');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Connected Extensions</Typography>
            {loading ? <CircularProgress size={24} /> : (
                <List>
                    {devices.length === 0 && <ListItem><ListItemText primary="No extensions connected." /></ListItem>}
                    {devices.map(device => (
                        <ListItem key={device.token} secondaryAction={
                            <IconButton edge="end" aria-label="delete" onClick={() => handleRevoke(device.token)}>
                                <DeleteIcon />
                            </IconButton>
                        }>
                            <ListItemText
                                primary={`Token: ${device.token.slice(0, 8)}...`}
                                secondary={`Created: ${new Date(device.created_at * 1000).toLocaleString()}`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Extension Settings</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                    label="Setting Key"
                    value={settingKey}
                    onChange={e => setSettingKey(e.target.value)}
                    size="small"
                />
                <TextField
                    label="Value"
                    value={settingValue}
                    onChange={e => setSettingValue(e.target.value)}
                    size="small"
                />
                <Button variant="contained" onClick={handleSettingSave} disabled={saving || !settingKey}>Save</Button>
            </Box>
            <Box>
                {Object.keys(settings).length === 0 && <Typography color="textSecondary">No settings configured.</Typography>}
                {Object.entries(settings).map(([key, value]) => (
                    <Typography key={key}>{key}: {String(value)}</Typography>
                ))}
            </Box>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
    );
} 