import React, { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Alert, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from "@mui/material";
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LinkIcon from '@mui/icons-material/Link';
import { ApiClient } from "../../lib/api";

const PROVIDERS = [
    { key: 'google', label: 'Google', icon: <GoogleIcon color="error" /> },
    { key: 'github', label: 'GitHub', icon: <GitHubIcon color="action" /> },
];

export default function ConnectedAccountsSection() {
    const [linked, setLinked] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [unlinking, setUnlinking] = useState<string | null>(null);

    useEffect(() => {
        fetchLinked();
    }, []);

    const fetchLinked = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await ApiClient.get("/users/linked-accounts") as any[];
            setLinked(data);
        } catch (err: any) {
            setError("Failed to load linked accounts");
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async (provider: string) => {
        setUnlinking(provider);
        setError("");
        setSuccess("");
        try {
            await ApiClient.delete(`/users/linked-accounts/${provider}`);
            setSuccess(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked.`);
            setLinked(prev => prev.filter((a: any) => a.provider !== provider));
        } catch (err: any) {
            setError("Failed to unlink account.");
        } finally {
            setUnlinking(null);
        }
    };

    // Placeholder for linking logic (would redirect to OAuth flow)
    const handleLink = (provider: string) => {
        window.location.href = `http://localhost:5000/auth/${provider}`;
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Connected Accounts</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <List>
                {PROVIDERS.map(p => {
                    const isLinked = linked.some((a: any) => a.provider === p.key);
                    const account = linked.find((a: any) => a.provider === p.key);
                    return (
                        <ListItem key={p.key} divider>
                            <ListItemText
                                primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{p.icon} {p.label}</Box>}
                                secondary={isLinked ? `Linked as ${account?.email || ''}` : 'Not linked'}
                            />
                            <ListItemSecondaryAction>
                                {isLinked ? (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<LinkOffIcon />}
                                        onClick={() => handleUnlink(p.key)}
                                        disabled={unlinking === p.key}
                                    >
                                        {unlinking === p.key ? 'Unlinking...' : 'Unlink'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<LinkIcon />}
                                        onClick={() => handleLink(p.key)}
                                    >
                                        Connect
                                    </Button>
                                )}
                            </ListItemSecondaryAction>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
} 