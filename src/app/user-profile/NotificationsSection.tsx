import React, { useEffect, useState } from "react";
import { Box, Typography, Switch, FormControlLabel, Button, Alert, CircularProgress } from "@mui/material";
import { ApiClient } from "../../lib/api";

export default function NotificationsSection() {
    const [prefs, setPrefs] = useState({
        email: true,
        push: false,
        newsletter: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        setLoading(true);
        ApiClient.get("/users/notifications")
            .then((data: any) => {
                setPrefs(data);
                setLoading(false);
            })
            .catch((err) => {
                setError("Failed to load preferences");
                setLoading(false);
            });
    }, []);

    const handleToggle = (key: string) => {
        setPrefs((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await ApiClient.post("/users/notifications", prefs);
            setSuccess("Preferences updated!");
        } catch (err) {
            setError("Failed to save preferences");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Notification Preferences</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <FormControlLabel
                control={<Switch checked={prefs.email} onChange={() => handleToggle("email")} />}
                label="Email Notifications"
            />
            <FormControlLabel
                control={<Switch checked={prefs.push} onChange={() => handleToggle("push")} />}
                label="Push Notifications"
            />
            <FormControlLabel
                control={<Switch checked={prefs.newsletter} onChange={() => handleToggle("newsletter")} />}
                label="Newsletter"
            />
            <Box mt={2}>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Preferences"}
                </Button>
            </Box>
        </Box>
    );
} 