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
import { ApiClient, getApiBaseUrl } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'email' | 'passcode'>('email');
  const [formData, setFormData] = useState({
    email: '',
    passcode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;

    setLoading(true);
    setError('');
    try {
      console.log('Sending passcode for email:', formData.email);
      // Send email to get passcode
      await ApiClient.post('/auth/send-passcode', { email: formData.email });

      // Clear any previous errors and show success message
      setError('');
      setSuccessMessage('Passcode sent successfully! Check your email.');

      // Move to passcode step
      setCurrentStep('passcode');

      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Failed to send passcode. Please try again.';

      // Check if it's a user not registered error
      if (errorMessage.includes('not registered') || errorMessage.includes('sign up')) {
        setError('Account not found. Please sign up first or check your email address.');
      } else {
        setError(errorMessage);
      }
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
      const result = await ApiClient.post<{ access_token: string }>('/auth/login-passcode', {
        email: formData.email,
        passcode: formData.passcode
      });

      // Store the access token
      localStorage.setItem('access_token', result.access_token);

      // Clear any messages before redirecting
      setError('');
      setSuccessMessage('');

      // Redirect to welcome page
      router.push('/welcome');
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Invalid passcode. Please try again.';

      // Check if it's a user not registered error
      if (errorMessage.includes('not registered') || errorMessage.includes('sign up')) {
        setError('Account not found. Please sign up first or check your email address.');
        setSuccessMessage(''); // Clear success message
        setCurrentStep('email'); // Go back to email step
      } else if (errorMessage.includes('Invalid passcode')) {
        setError('Invalid passcode. Please check the code and try again.');
        setSuccessMessage(''); // Clear success message
      } else if (errorMessage.includes('expired')) {
        setError('Passcode has expired. Please request a new one.');
        setSuccessMessage(''); // Clear success message
      } else {
        setError(errorMessage);
        setSuccessMessage(''); // Clear success message
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear success message when user changes email
    if (e.target.name === 'email') {
      setSuccessMessage('');
    }
  };



  const handleGoogleSignIn = () => {
    window.location.href = `${getApiBaseUrl()}/auth/google`;
  };

  const handleResendPasscode = async () => {
    try {
      await ApiClient.post('/auth/send-passcode', { email: formData.email });

      // Clear the current passcode
      setFormData(prev => ({ ...prev, passcode: '' }));

      // Show success message
      setError(''); // Clear any previous errors
      setSuccessMessage('New passcode sent successfully! Check your email.');
      // You could add a toast notification here for success
      console.log('Passcode resent successfully');

      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Failed to resend passcode. Please try again.';

      // Check if it's a user not registered error
      if (errorMessage.includes('not registered') || errorMessage.includes('sign up')) {
        setError('Account not found. Please sign up first or check your email address.');
        setSuccessMessage(''); // Clear success message
        setCurrentStep('email'); // Go back to email step
      } else {
        setError(errorMessage);
        setSuccessMessage(''); // Clear success message
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          bgcolor: '#fff',
          ml: 2,
          mr: 4,
          mt: -1,
          mb: 4,
          borderRadius: '0px',
          overflow: 'hidden',
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
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            height: 'calc(100vh - 48px)',
            mx: 2,
            my: 3,
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
                maxWidth: '70%',
                maxHeight: '20%',
                objectFit: 'contain',
                mb: 3,
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
            borderRadius: '24px',
            mx: 2,
            my: 3,
            height: 'calc(100vh - 48px)',
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
                  {/* Show helpful message if there's an account not found error */}
                  {error && error.includes('not registered') && (
                    <Box sx={{
                      p: 3,
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #2196f3',
                      borderRadius: '12px',
                      textAlign: 'center',
                      mb: 2
                    }}>
                      <Typography variant="body1" sx={{ color: '#1976d2', mb: 1, fontWeight: 600 }}>
                        💡 New to Pogo?
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.4 }}>
                        This email isn't registered yet. Create your account to get started!
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => router.push('/register')}
                        sx={{
                          mt: 2,
                          bgcolor: '#00AAF8',
                          '&:hover': { bgcolor: '#0095e0' }
                        }}
                      >
                        Sign Up Now
                      </Button>
                    </Box>
                  )}

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
                      borderRadius: 4,
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
                        borderRadius: 4,
                      },
                    }}
                  />

                  {/* Show helpful tip when no error */}
                  {!error && formData.email && (
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>
                      💡 Enter the email address you used to sign up
                    </Typography>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      borderRadius: 4,
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
                    <Link href="/terms" sx={{ color: '#00AAF8' }} underline="hover">
                      Terms
                    </Link>{' '}
                    &{' '}
                    <Link href="/privacy" sx={{ color: '#00AAF8' }} underline="hover">
                      Privacy Policy
                    </Link>
                  </Typography>

                  <Typography variant="body2" sx={{ textAlign: 'center', color: '#666' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/register" sx={{ color: '#00AAF8' }} underline="hover">
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

                    {/* Show helpful message if there's an account not found error */}
                    {error && error.includes('not registered') && (
                      <Box sx={{
                        p: 2,
                        backgroundColor: '#fff3e0',
                        border: '1px solid #ff9800',
                        borderRadius: '8px',
                        textAlign: 'center',
                        mb: 2
                      }}>
                        <Typography variant="body2" sx={{ color: '#e65100', mb: 1, fontWeight: 600 }}>
                          ⚠️ Account Issue Detected
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          This email isn't registered. Please go back and sign up first.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setError('');
                            setSuccessMessage('');
                            setCurrentStep('email');
                          }}
                          sx={{
                            mt: 1,
                            borderColor: '#ff9800',
                            color: '#ff9800',
                            '&:hover': {
                              borderColor: '#f57c00',
                              backgroundColor: 'rgba(255, 152, 0, 0.04)'
                            }
                          }}
                        >
                          Go Back to Sign In
                        </Button>
                      </Box>
                    )}
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
                            borderRadius: 4,
                            height: 50,
                          },
                        }}
                      />
                    ))}
                  </Box>

                  {/* Show helpful message for expired passcode */}
                  {error && error.includes('expired') && (
                    <Box sx={{
                      p: 2,
                      backgroundColor: '#fff3e0',
                      border: '1px solid #ff9800',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" sx={{ color: '#e65100', mb: 1, fontWeight: 600 }}>
                        ⏰ Passcode Expired
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                        Your passcode has expired. Please request a new one.
                      </Typography>
                    </Box>
                  )}

                  {/* Show success message */}
                  {successMessage && (
                    <Box sx={{
                      p: 2,
                      backgroundColor: '#e8f5e8',
                      border: '1px solid #4caf50',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                        ✅ {successMessage}
                      </Typography>
                    </Box>
                  )}

                  {/* Show helpful tip when no error and no success message */}
                  {!error && !successMessage && (
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>
                      💡 Enter the 6-digit code from your email
                    </Typography>
                  )}

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
                      borderRadius: 4,
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
                    <Link href="/register" sx={{ color: '#00AAF8' }} underline="hover">
                      Sign up
                    </Link>
                  </Typography>
                </Stack>
              </Box>
            )}

            {error && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography
                  color="error"
                  sx={{
                    mb: 2,
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                    padding: '12px 16px',
                    backgroundColor: '#fff5f5',
                    border: '1px solid #fed7d7',
                    borderRadius: '8px',
                    color: '#c53030'
                  }}
                >
                  {error}
                </Typography>

                {/* Show action buttons for specific error types */}
                {error.includes('Account not found') && (
                  <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push('/register')}
                      sx={{
                        borderColor: '#00AAF8',
                        color: '#00AAF8',
                        '&:hover': {
                          borderColor: '#0095e0',
                          backgroundColor: 'rgba(0, 170, 248, 0.04)'
                        }
                      }}
                    >
                      Sign Up
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setError('');
                        setSuccessMessage('');
                        setCurrentStep('email');
                      }}
                      sx={{ color: '#666' }}
                    >
                      Try Different Email
                    </Button>
                  </Stack>
                )}

                {error.includes('Passcode has expired') && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleResendPasscode}
                    sx={{
                      mt: 1,
                      borderColor: '#00AAF8',
                      color: '#00AAF8',
                      '&:hover': {
                        borderColor: '#0095e0',
                        backgroundColor: 'rgba(0, 170, 248, 0.04)'
                      }
                    }}
                  >
                    Request New Passcode
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 