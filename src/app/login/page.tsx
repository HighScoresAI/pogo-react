'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
  Stack,
} from '@mui/material';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'email' | 'passcode'>('email');
  const [formData, setFormData] = useState({
    email: '',
    passcode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;

    setLoading(true);
    setError('');
    try {
      // Send email to get passcode
      const response = await fetch('http://localhost:5000/auth/send-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send passcode');
      }

      // Move to passcode step
      setCurrentStep('passcode');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.passcode || formData.passcode.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      // Validate passcode and login
      const response = await fetch('http://localhost:5000/auth/login-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          passcode: formData.passcode
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid passcode');
      }

      const result = await response.json();

      // Store the access token
      localStorage.setItem('access_token', result.access_token);

      // Redirect to welcome page
      router.push('/welcome');
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };



  const handleGoogleSignIn = () => {
    window.location.href = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
      : 'http://localhost:5000/auth/google';
  };

  const handleResendPasscode = async () => {
    try {
      const response = await fetch('http://localhost:5000/auth/send-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to resend passcode');
      }

      // Clear the current passcode
      setFormData(prev => ({ ...prev, passcode: '' }));

      // Show success message (you could add a toast notification here)
      console.log('Passcode resent successfully');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to resend passcode. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        bgcolor: '#f5f5f5',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          bgcolor: '#fff',
        }}
      >
        {/* Left Panel - Illustration and Marketing */}
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(180deg, #E3F2FD 0%, #E8F5E8 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            mx: 2,
            my: 2,
            position: 'relative',
            borderRadius: '0 12px 12px 0',
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

            {/* Central Illustration */}
            <Box
              component="img"
              src="/signUpimg1.png"
              alt="Sign Up Illustration"
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
            <Box
              sx={{
                textAlign: 'center',
                color: '#1a1a1a',
                maxWidth: 500,
                px: 2,
                mb: 4,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: '#242426',
                  textAlign: 'center',
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: 'normal',
                  mb: 3,
                }}
              >
                {currentStep === 'email'
                  ? 'Improve User Adoption of your SaaS Product'
                  : 'Up-to-date Product Documentation'
                }
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: '#4a4a4a',
                }}
              >
                {currentStep === 'email'
                  ? 'Help users get started faster with interactive onboarding and guided walkthroughs'
                  : 'Ensure your documentation stays current and easy to access at any time'
                }
              </Typography>
            </Box>

            {/* Bottom Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Progress Indicators */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
              }}
            >
              {[1, 2, 3].map((dot) => (
                <Box
                  key={dot}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: dot === 1 ? '#1976d2' : '#E0E0E0',
                    transition: 'background-color 0.3s ease',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right Panel - Sign In Form */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: '#fff',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 400,
              px: 4,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 6,
                color: '#1a1a1a',
                textAlign: 'center',
                fontSize: '2rem',
              }}
            >
              Sign in to Hello Pogo
            </Typography>

            {currentStep === 'email' ? (
              // Email Input Step
              <Box component="form" onSubmit={handleEmailSubmit}>
                <Stack spacing={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
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
                      '&:hover': {
                        bgcolor: '#f5f5f5',
                        borderColor: '#BDBDBD',
                      },
                    }}
                    startIcon={
                      <Box sx={{ mr: 1 }}>
                        <img
                          src="/google-color-icon 1.svg"
                          alt="Google"
                          style={{ width: 20, height: 20 }}
                        />
                      </Box>
                    }
                    onClick={handleGoogleSignIn}
                  >
                    Continue with Google
                  </Button>

                  <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" sx={{ color: '#666', px: 2 }}>
                      Or sign in with
                    </Typography>
                  </Divider>

                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    placeholder="Enter your email"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      borderRadius: 2,
                      py: 2,
                      bgcolor: '#1976d2',
                      '&:hover': {
                        bgcolor: '#1565c0',
                      },
                    }}
                    disabled={loading || !formData.email}
                  >
                    {loading ? 'Sending...' : 'Continue'}
                  </Button>

                  <Typography variant="body2" sx={{ textAlign: 'center', color: '#666' }}>
                    By signing up, you agree to our{' '}
                    <Link href="/terms" color="primary" underline="hover">
                      Terms
                    </Link>{' '}
                    &{' '}
                    <Link href="/privacy" color="primary" underline="hover">
                      Privacy Policy
                    </Link>
                  </Typography>

                  <Typography variant="body2" sx={{ textAlign: 'center', color: '#666' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/register" color="primary" underline="hover">
                      Sign up
                    </Link>
                  </Typography>
                </Stack>
              </Box>
            ) : (
              // Passcode Input Step
              <Box component="form" onSubmit={handlePasscodeSubmit}>
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: '#1a1a1a',
                      }}
                    >
                      Check your email
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                      We&apos;ve sent a 6-digit passcode. Please check your inbox at{' '}
                      <span style={{ fontWeight: 600 }}>
                        {formData.email.replace(/(.{2}).*(@.*)/, '$1****$2')}
                      </span>
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    {Array.from({ length: 6 }, (_, index) => (
                      <TextField
                        key={index}
                        value={formData.passcode[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                          const newPasscode = formData.passcode.split('');
                          newPasscode[index] = value;
                          const updatedPasscode = newPasscode.join('');

                          setFormData(prev => ({
                            ...prev,
                            passcode: updatedPasscode
                          }));

                          // Auto-focus next input if value entered
                          if (value && index < 5) {
                            const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
                            if (nextInput) {
                              nextInput.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace to go to previous input
                          if (e.key === 'Backspace' && !formData.passcode[index] && index > 0) {
                            const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
                            if (prevInput) {
                              prevInput.focus();
                            }
                          }
                        }}
                        inputProps={{
                          maxLength: 1,
                          style: { textAlign: 'center', fontSize: '1.2rem' },
                          'data-index': index,
                        }}
                        sx={{
                          width: 50,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            height: 50,
                          },
                        }}
                      />
                    ))}
                  </Box>

                  <Link
                    component="button"
                    variant="body2"
                    onClick={handleResendPasscode}
                    sx={{
                      color: '#666',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Resend
                  </Link>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      borderRadius: 2,
                      py: 1.5,
                      bgcolor: '#1976d2',
                      '&:hover': {
                        bgcolor: '#1565c0',
                      },
                    }}
                    disabled={loading || formData.passcode.length !== 6}
                  >
                    {loading ? 'Signing In...' : 'Log in'}
                  </Button>

                  <Typography variant="body2" sx={{ textAlign: 'center', color: '#666' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/register" color="primary" underline="hover">
                      Sign up
                    </Link>
                  </Typography>
                </Stack>
              </Box>
            )}

            {error && (
              <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                {error}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 