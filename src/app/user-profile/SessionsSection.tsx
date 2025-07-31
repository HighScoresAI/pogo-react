import React, { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Alert, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import { ApiClient } from "../../lib/api";

export default function SessionsSection() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [revoking, setRevoking] = useState<string | null>(null);
    const [revokingOthers, setRevokingOthers] = useState(false);

    // Optionally, store the current session ID if available
    // const currentSessionId = ...;

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await ApiClient.get("/auth/sessions");
            setSessions(data as any[]);
        } catch (err: any) {
            setError("Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (sessionId: string) => {
        setRevoking(sessionId);
        setError("");
        setSuccess("");
        try {
            await ApiClient.delete(`/auth/sessions/${sessionId}`);
            setSuccess("Session revoked.");
            fetchSessions();
        } catch (err: any) {
            setError("Failed to revoke session.");
        } finally {
            setRevoking(null);
        }
    };

    const handleRevokeOthers = async () => {
        setRevokingOthers(true);
        setError("");
        setSuccess("");
        try {
            await ApiClient.post("/auth/sessions/revoke-others", {});
            setSuccess("Other sessions revoked.");
            fetchSessions();
        } catch (err: any) {
            setError("Failed to revoke other sessions.");
        } finally {
            setRevokingOthers(false);
        }
    };

    // Determine if there are other sessions to revoke
    const hasOtherSessions = sessions.length > 1;

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Active Sessions</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <List>
                {sessions.length === 0 && (
                    <ListItem>
                        <ListItemText primary="No active sessions found." sx={{ textAlign: 'center' }} />
                    </ListItem>
                )}
                {sessions.map((session) => (
                    <ListItem key={session._id || session.sessionId} divider>
                        <ListItemText
                            primary={session.device || session.userAgent || 'Unknown Device'}
                            secondary={`IP: ${session.ip || 'N/A'} | Last Active: ${session.lastActive || session.updatedAt || 'N/A'}`}
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                edge="end"
                                color="error"
                                onClick={() => handleRevoke(session._id || session.sessionId)}
                                disabled={revoking === (session._id || session.sessionId)}
                            >
                                <LogoutIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
            {hasOtherSessions && (
                <Box sx={{ textAlign: 'right', mt: 2 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRevokeOthers}
                        disabled={revokingOthers}
                    >
                        {revokingOthers ? 'Revoking...' : 'Revoke All Other Sessions'}
                    </Button>
                </Box>
            )}
        </Box>
    );
} 