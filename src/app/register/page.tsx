"use client";
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { ApiClient, getApiBaseUrl } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setLoading(false);
      return;
    }

    try {
      await ApiClient.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });

      // Registration successful
      router.push('/login');
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = getApiBaseUrl() + '/auth/google';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        bgcolor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'row',
          bgcolor: '#fff',
          mx: 2,
          my: 2,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Left Panel - Marketing/Illustration */}
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(180deg, #E3F2FD 0%, #E8F5E8 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            position: 'relative',
            borderRadius: '12px 0 0 12px',
            overflow: 'hidden',
            height: '100vh',
          }}
        >
          {/* Main Content Container */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
              width: '100%',
              maxWidth: 500,
              py: 4,
            }}
          >
            {/* Top Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Illustration */}
            <Box
              component="img"
              src="/signUpimg1.png"
              alt="Save Time on Product Documentation"
              sx={{
                width: 'auto',
                height: 'auto',
                maxWidth: '80%',
                maxHeight: '40%',
                objectFit: 'contain',
                mb: 4,
              }}
            />

            {/* Text Content */}
            <Box sx={{ textAlign: 'center', color: '#1a1a1a', maxWidth: 400, px: 2, mb: 4 }}>
              <Typography
                sx={{
                  color: '#242426',
                  textAlign: 'center',
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: 'normal',
                  mb: 2,
                }}
              >
                Save Time on Product Documentation
              </Typography>
              <Typography
                sx={{
                  fontSize: '16px',
                  lineHeight: 1.5,
                  color: '#4a4a4a',
                }}
              >
                Automate documentation to save hours on writing and updates.
              </Typography>
            </Box>

            {/* Bottom Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Progress Indicators */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {[true, false, false, false, false].map((isActive, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: isActive ? '#1976d2' : '#E0E0E0',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right Panel - Sign-up Form */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
            bgcolor: '#fff',
            overflow: 'hidden',
            height: '100vh',
            borderRadius: '0 12px 12px 0',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 380, px: 3 }}>
            {/* Title */}
            <Typography
              sx={{
                color: '#242426',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '24px',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: 'normal',
                mb: 3,
              }}
            >
              Sign up to Hello Pogo
            </Typography>

            {/* Google Sign-in Button */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGoogleSignIn}
              startIcon={
                <Box sx={{ mr: 1 }}>
                  <img
                    src="/google-color-icon 1.svg"
                    alt="Google"
                    style={{ width: 20, height: 20 }}
                  />
                </Box>
              }
              sx={{
                color: '#000',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal',
                borderRadius: 2,
                py: 2,
                bgcolor: '#fff',
                borderColor: '#E0E0E0',
                textTransform: 'uppercase',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  borderColor: '#BDBDBD',
                },
              }}
            >
              Continue with Google
            </Button>

            {/* Divider */}
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" sx={{ color: '#666', px: 2 }}>
                Or sign in with
              </Typography>
            </Divider>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                fullWidth
                placeholder="First Name"
                size="small"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                fullWidth
                placeholder="Last Name"
                size="small"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                placeholder="Email"
                size="small"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="medium"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: 2,
                  bgcolor: '#1976d2',
                  textTransform: 'uppercase',
                  '&:hover': {
                    bgcolor: '#1565c0',
                  },
                }}
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </Button>

              {error && (
                <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}
            </Box>

            {/* Legal Text */}
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                mt: 2,
                color: '#666',
                fontSize: '0.75rem',
              }}
            >
              By signing up, you agree to our{' '}
              <Link href="#" color="primary" underline="hover">
                Terms
              </Link>{' '}
              &{' '}
              <Link href="#" color="primary" underline="hover">
                Privacy Policy
              </Link>
            </Typography>

            {/* Login Link */}
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                mt: 2,
                color: '#666',
                fontSize: '0.875rem',
              }}
            >
              Already have an account?{' '}
              <Link href="/login" color="primary" underline="hover">
                Log in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 