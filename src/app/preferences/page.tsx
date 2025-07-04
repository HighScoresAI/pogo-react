'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface Preference {
  name: string;
  description: string;
  status: string;
  key: string;
  enabled: boolean;
}

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([
    {
      name: 'Email Notifications',
      description: 'Receive email updates for important account activity and project changes.',
      status: 'Enabled',
      key: 'emailNotifications',
      enabled: true,
    },
    {
      name: 'Dark Mode',
      description: 'Switch to a dark color scheme for low-light environments.',
      status: 'Disabled',
      key: 'darkMode',
      enabled: false,
    },
    {
      name: 'Compact View',
      description: 'Use a more compact layout to fit more content on screen.',
      status: 'Disabled',
      key: 'compactView',
      enabled: false,
    },
    {
      name: 'Weekly Digest',
      description: 'Receive a weekly summary of your project activities.',
      status: 'Enabled',
      key: 'weeklyDigest',
      enabled: true,
    },
    {
      name: 'Session Reminders',
      description: 'Get reminded about upcoming sessions and meetings.',
      status: 'Enabled',
      key: 'sessionReminders',
      enabled: true,
    },
    {
      name: 'Mention Notifications',
      description: 'Receive notifications when you are mentioned in projects.',
      status: 'Enabled',
      key: 'mentionNotifications',
      enabled: true,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { getUserId } = useAuth();

  const handlePreferenceChange = (key: string, enabled: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.key === key
          ? { ...pref, enabled, status: enabled ? 'Enabled' : 'Disabled' }
          : pref
      )
    );
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const preferencesData = preferences.reduce((acc, pref) => {
      //   acc[pref.key] = pref.enabled;
      //   return acc;
      // }, {} as Record<string, boolean>);
      // await ApiClient.put('/user/preferences', preferencesData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Enabled' ? 'success' : 'default';
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Box className="mb-6">
        <Typography variant="h4" className="mb-2">
          Preferences
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Customize your experience and notification settings
        </Typography>
      </Box>

      {message && (
        <Alert 
          severity={message.includes('successfully') ? 'success' : 'error'} 
          className="mb-4"
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {preferences.map((preference) => (
          <Grid item xs={12} md={6} lg={4} key={preference.key}>
            <Card className="h-full">
              <CardHeader
                title={preference.name}
                action={
                  <Chip
                    label={preference.status}
                    color={getStatusColor(preference.status) as any}
                    size="small"
                  />
                }
              />
              <CardContent>
                <Typography variant="body2" color="textSecondary" className="mb-3">
                  {preference.description}
                </Typography>
                <Divider className="my-2" />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preference.enabled}
                      onChange={(e) => handlePreferenceChange(preference.key, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={preference.enabled ? 'Enabled' : 'Disabled'}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box className="flex justify-end mt-6">
        <Button
          variant="contained"
          onClick={handleSavePreferences}
          disabled={isLoading}
          size="large"
        >
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>
    </Container>
  );
} 