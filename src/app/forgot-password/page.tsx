'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await ApiClient.post('/auth/forgot-password', { email });

      // Simulate API call
      // await new Promise(resolve => setTimeout(resolve, 1000));

      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Box className="min-h-screen flex">
        {/* Left Panel */}
        <Box className="hidden md:flex flex-col justify-center items-center p-5 bg-primary.main text-white w-1/2">
          <Typography variant="h3" className="mb-4">
            HelloPogo
          </Typography>
          <Typography variant="h6" className="mb-4">
            Your all-in-one workspace solution
          </Typography>

          <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm">
            <CardContent className="text-center">
              <Typography variant="h5" className="mb-3">
                🚀 Boost Productivity
              </Typography>
              <Typography>
                Teams using HelloPogo report a 37% increase in productivity.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Right Panel */}
        <Box className="flex flex-col justify-center items-center flex-grow-1 p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardContent className="p-6">
              <Box className="text-center mb-6">
                <Typography variant="h4" className="mb-2">
                  HelloPogo
                </Typography>
                <Typography variant="h6" className="mb-1">
                  Check Your Email
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  We've sent a password reset link to your email
                </Typography>
              </Box>

              <Alert severity="success" className="mb-4">
                Password reset email sent successfully! Please check your inbox and follow the instructions to reset your password.
              </Alert>

              <Box className="text-center">
                <Typography variant="body2" className="mb-3">
                  Didn't receive the email? Check your spam folder or{' '}
                  <Link href="#" underline="hover" onClick={() => setIsSubmitted(false)}>
                    try again
                  </Link>
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.push('/login')}
                >
                  Back to Login
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen flex">
      {/* Left Panel */}
      <Box className="hidden md:flex flex-col justify-center items-center p-5 bg-primary.main text-white w-1/2">
        <Typography variant="h3" className="mb-4">
          HelloPogo
        </Typography>
        <Typography variant="h6" className="mb-4">
          Your all-in-one workspace solution
        </Typography>

        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm">
          <CardContent className="text-center">
            <Typography variant="h5" className="mb-3">
              🚀 Boost Productivity
            </Typography>
            <Typography>
              Teams using HelloPogo report a 37% increase in productivity.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Right Panel */}
      <Box className="flex flex-col justify-center items-center flex-grow-1 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6">
            <Box className="text-center mb-6">
              <Typography variant="h4" className="mb-2">
                HelloPogo
              </Typography>
              <Typography variant="h6" className="mb-1">
                Forgot Password
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Enter your email to reset your password
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4"
                required
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                className="mb-4"
              >
                {isLoading ? 'Sending...' : 'Reset Password'}
              </Button>

              <Box className="text-center">
                <Typography variant="body2">
                  Remember your password?{' '}
                  <Link href="/login" underline="hover">
                    Back to login
                  </Link>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 