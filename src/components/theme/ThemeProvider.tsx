'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#9155FD',
    },
    secondary: {
      main: '#8A8D93',
    },
    background: {
      default: '#F4F5FA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#333333',
        },
      },
    },
  },
});

type ThemeProviderProps = {
  children: ReactNode;
};

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering CssBaseline until client-side
  if (!mounted) {
    return (
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    );
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider; 