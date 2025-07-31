import React, { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Alert, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { ApiClient } from "../../lib/api";

export default function ApiAccessSection() {
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [creating, setCreating] = useState(false);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const fetchApiKeys = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await ApiClient.get("/users/api-keys") as any[];
            setApiKeys(data);
        } catch (err: any) {
            setError("Failed to load API keys");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        setError("");
        setSuccess("");
        try {
            const newKey = await ApiClient.post("/users/api-keys", {});
            setSuccess("API key created.");
            setApiKeys(prev => [...prev, newKey]);
        } catch (err: any) {
            setError("Failed to create API key.");
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (key: string) => {
        setRevoking(key);
        setError("");
        setSuccess("");
        try {
            await ApiClient.delete(`/users/api-keys/${key}`);
            setSuccess("API key revoked.");
            setApiKeys(prev => prev.filter(k => k.key !== key));
        } catch (err: any) {
            setError("Failed to revoke API key.");
        } finally {
            setRevoking(null);
        }
    };

    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>API Access</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <Button variant="contained" color="success" onClick={handleCreate} disabled={creating} sx={{ mb: 2 }}>
                {creating ? 'Creating...' : 'Generate New API Key'}
            </Button>
            <List>
                {apiKeys.length === 0 && (
                    <ListItem>
                        <ListItemText primary="No API keys found." />
                    </ListItem>
                )}
                {apiKeys.map((k) => (
                    <ListItem key={k.key} divider>
                        <ListItemText
                            primary={<Box sx={{ fontFamily: 'monospace' }}>{k.key}</Box>}
                            secondary={`Created: ${new Date(k.createdAt).toLocaleString()}`}
                        />
                        <ListItemSecondaryAction>
                            <Tooltip title={copiedKey === k.key ? 'Copied!' : 'Copy'}>
                                <IconButton edge="end" onClick={() => handleCopy(k.key)}>
                                    <ContentCopyIcon color={copiedKey === k.key ? 'success' : 'inherit'} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Revoke">
                                <span>
                                    <IconButton edge="end" color="error" onClick={() => handleRevoke(k.key)} disabled={revoking === k.key}>
                                        <DeleteIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
} 