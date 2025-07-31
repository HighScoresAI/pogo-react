'use client';

import React from 'react';
import { Box, Typography, Container } from '@mui/material';

export default function TestPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Page
        </Typography>
        <Typography variant="body1">
          This is a test page for development purposes.
        </Typography>
      </Box>
    </Container>
  );
}
