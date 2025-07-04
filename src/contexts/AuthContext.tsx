'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../lib/api';
import { LoginRequest, LoginResponse, SignupRequest, SignupResponse } from '../types/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  getUserId: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  };

  const getUserId = (): string | null => {
    const token = getToken();
    if (!token) return null;

    try {
      const decodedToken: any = JSON.parse(atob(token.split('.')[1]));
      return decodedToken?.sub || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const login = async (data: LoginRequest): Promise<void> => {
    try {
      const response: LoginResponse = await ApiClient.post('/auth/login', data);
      
      if (response && response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        setIsLoggedIn(true);
        setUserId(getUserId());
        router.push('/dashboard');
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
      // After successful signup, redirect to login or auto-login
      router.push('/login');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setUserId(null);
    router.push('/login');
  };

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (token) {
      setIsLoggedIn(true);
      setUserId(getUserId());
    }
  }, []);

  const value: AuthContextType = {
    isLoggedIn,
    userId,
    login,
    signup,
    logout,
    getToken,
    getUserId,
  };

  // Prevent hydration mismatch by ensuring consistent initial state
  if (!mounted) {
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