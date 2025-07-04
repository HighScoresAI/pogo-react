'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, Google } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('Too weak');

  const { signup } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Password strength calculation
    if (field === 'password') {
      const password = value as string;
      if (password.length === 0) {
        setPasswordStrength('Too weak');
      } else if (password.length < 8) {
        setPasswordStrength('Weak');
      } else if (password.length < 12) {
        setPasswordStrength('Medium');
      } else {
        setPasswordStrength('Strong');
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
      });
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
    console.log('Google signup clicked');
  };

  return (
    <Box className="min-h-screen flex">
      {/* Left Panel - Benefits Carousel */}
      <Box className="hidden md:flex flex-col justify-center items-center p-5 bg-primary.main text-white w-1/2">
        <Typography variant="h3" className="mb-4">
          HelloPogo
        </Typography>
        <Typography variant="h6" className="mb-4">
          Your all-in-one workspace solution
        </Typography>
        
        {/* Benefits Cards */}
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

      {/* Right Panel - Registration Form */}
      <Box className="flex flex-col justify-center items-center flex-grow-1 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6">
            <Box className="text-center mb-6">
              <Typography variant="h4" className="mb-2">
                HelloPogo
              </Typography>
              <Typography variant="h6" className="mb-1">
                Create an Account
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Get started with HelloPogo
              </Typography>
            </Box>

            {errors.submit && (
              <Alert severity="error" className="mb-3">
                {errors.submit}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2} className="mb-3">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    required
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                className="mb-3"
                required
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password || `Password strength: ${passwordStrength}`}
                className="mb-3"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                className="mb-4"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link href="#" underline="hover">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" underline="hover">
                      Privacy Policy
                    </Link>
                  </Typography>
                }
                className="mb-4"
              />
              {errors.acceptTerms && (
                <Typography variant="caption" color="error" className="block mb-2">
                  {errors.acceptTerms}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                className="mb-3"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <Divider className="my-3">
                <Typography variant="body2" color="textSecondary">
                  OR
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                onClick={handleGoogleSignup}
                className="mb-3"
              >
                Sign up with Google
              </Button>

              <Box className="text-center">
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link href="/login" underline="hover">
                    Sign in
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