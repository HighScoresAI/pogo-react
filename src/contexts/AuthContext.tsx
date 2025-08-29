'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient } from '../lib/api';
import { LoginRequest, LoginResponse, SignupRequest, SignupResponse } from '../types/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  userProfile: any | null;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  getUserId: () => string | null;
  getUserIdFromToken: (token: string) => string | null;
  verifyToken: () => Promise<boolean>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  };

  const hasProfileLoaded = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('profile_loaded') === 'true';
  };

  const setProfileLoaded = (loaded: boolean): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('profile_loaded', loaded.toString());
  };

  const getUserId = (): string | null => {
    const token = getToken();
    if (!token) return null;

    try {
      const decodedToken: any = JSON.parse(atob(token.split('.')[1]));
      // Use the same logic as getUserIdFromToken for consistency
      return decodedToken?.sub || decodedToken?.userId || decodedToken?.user_id || decodedToken?.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const verifyToken = async (): Promise<boolean> => {
    const token = getToken();
    if (!token) return false;

    try {
      // Try to get user profile to verify token is valid
      const response = await ApiClient.getUserProfile();
      console.log('AuthContext: Token verification successful:', response);
      setUserProfile(response);

      // Store profile in localStorage for restoration on refresh
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_profile', JSON.stringify(response));
      }

      return true;
    } catch (error) {
      console.error('AuthContext: Token verification failed:', error);
      // Token is invalid, clear it
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
      setIsLoggedIn(false);
      setUserId(null);
      setUserProfile(null);
      return false;
    }
  };

  const getUserIdFromToken = (token: string): string | null => {
    if (!token) return null;

    try {
      console.log('AuthContext: Raw token:', token);
      const payload = token.split('.')[1];
      console.log('AuthContext: Token payload (base64):', payload);
      const decodedToken: any = JSON.parse(atob(payload));
      console.log('AuthContext: Decoded token payload:', decodedToken);
      console.log('AuthContext: Looking for userId in:', Object.keys(decodedToken));

      // Try different possible fields for userId
      const userId = decodedToken?.sub || decodedToken?.userId || decodedToken?.user_id || decodedToken?.id || null;
      console.log('AuthContext: Extracted userId:', userId);

      return userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const login = async (data: LoginRequest): Promise<void> => {
    try {
      console.log('AuthContext: Login attempt with data:', data);
      const response: LoginResponse = await ApiClient.post('/auth/login', data);
      console.log('AuthContext: Login response:', response);

      if (response && response.access_token) {
        console.log('AuthContext: Got access token, storing in localStorage');
        localStorage.setItem('access_token', response.access_token);
        const userId = getUserIdFromToken(response.access_token);
        console.log('AuthContext: Extracted userId from token:', userId);
        setIsLoggedIn(true);
        setUserId(userId);

        // Load user profile after successful login
        try {
          const userProfileResponse = await ApiClient.getUserProfile();
          setUserProfile(userProfileResponse);
          setProfileLoaded(true);

          // Store profile in localStorage for restoration on refresh
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_profile', JSON.stringify(userProfileResponse));
          }
        } catch (profileError) {
          console.error('AuthContext: Failed to load user profile:', profileError);
        }

        router.push('/welcome');
      } else {
        console.error('AuthContext: No access token in response');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (data: SignupRequest): Promise<void> => {
    try {
      const response: SignupResponse = await ApiClient.post('/auth/signup', data);
      console.log('Signup response:', response);

      // If signup returns an access token, use it to log in automatically
      if (response && response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
        const userId = getUserIdFromToken(response.access_token);
        setIsLoggedIn(true);
        setUserId(userId);

        // Load user profile after successful signup
        try {
          const userProfileResponse = await ApiClient.getUserProfile();
          setUserProfile(userProfileResponse);
          setProfileLoaded(true);

          // Store profile in localStorage for restoration on refresh
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_profile', JSON.stringify(userProfileResponse));
          }
        } catch (profileError) {
          console.error('AuthContext: Failed to load user profile:', profileError);
        }

        router.push('/welcome');
      } else {
        // Fallback to login page if no token
        router.push('/login');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('profile_loaded');
    localStorage.removeItem('user_profile');
    setIsLoggedIn(false);
    setUserId(null);
    setUserProfile(null);
    router.push('/landing');
  };

  const refreshUserProfile = async (): Promise<void> => {
    try {
      const response = await ApiClient.getUserProfile();
      console.log('AuthContext: Refreshing user profile successful:', response);
      setUserProfile(response);
    } catch (error) {
      console.error('AuthContext: Refreshing user profile failed:', error);
      // Optionally, clear token if profile refresh fails
      localStorage.removeItem('access_token');
      setIsLoggedIn(false);
      setUserId(null);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    console.log('AuthContext: useEffect triggered, token:', !!token);

    if (token) {
      // Only verify token if we haven't already loaded the user profile
      if (!hasProfileLoaded()) {
        verifyToken().then(isValid => {
          if (isValid) {
            const userId = getUserIdFromToken(token);
            console.log('AuthContext: Token verified, extracted userId:', userId);
            setIsLoggedIn(true);
            setUserId(userId);
            setProfileLoaded(true);
            // User profile is already set in verifyToken()
          } else {
            console.log('AuthContext: Token invalid, clearing auth state');
            setIsLoggedIn(false);
            setUserId(null);
            setUserProfile(null);
            setProfileLoaded(false);
          }
          setIsInitializing(false);
        });
      } else {
        // We already have the profile flag, try to restore from localStorage or fetch again
        const userId = getUserIdFromToken(token);
        setIsLoggedIn(true);
        setUserId(userId);

        // Try to restore profile from localStorage or fetch it again
        const storedProfile = localStorage.getItem('user_profile');
        if (storedProfile) {
          try {
            const profile = JSON.parse(storedProfile);
            setUserProfile(profile);
          } catch (e) {
            // If stored profile is invalid, fetch it again
            refreshUserProfile();
          }
        } else {
          // No stored profile, fetch it again
          refreshUserProfile();
        }

        setIsInitializing(false);
      }
    } else {
      console.log('AuthContext: No token found, user not logged in');
      setIsLoggedIn(false);
      setUserId(null);
      setUserProfile(null);
      setProfileLoaded(false);
      setIsInitializing(false);
    }

    // Handle Google OAuth JWT token in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const jwt = params.get('token');
      if (jwt) {
        console.log('AuthContext: JWT token found in URL params');
        localStorage.setItem('access_token', jwt);
        const userId = getUserIdFromToken(jwt);
        console.log('AuthContext: JWT token processed, userId:', userId);
        setIsLoggedIn(true);
        setUserId(userId);
        // Remove token from URL and redirect to welcome page
        window.history.replaceState({}, document.title, window.location.pathname);
        router.push('/welcome');
      }
    }
  }, []); // Remove userProfile dependency to prevent infinite loop

  const value: AuthContextType = {
    isLoggedIn,
    userId,
    userProfile,
    login,
    signup,
    logout,
    getToken,
    getUserId,
    getUserIdFromToken,
    verifyToken,
    refreshUserProfile,
  };

  // Prevent hydration mismatch by ensuring consistent initial state
  if (!mounted || isInitializing) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 