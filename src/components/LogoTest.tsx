import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

export default function LogoTest() {
    const logos = [
        { name: 'HelloPogo Logo', src: '/hellopogo.png', alt: 'HelloPogo Logo' },
        { name: 'Frame (2) - Sessions', src: '/Frame (2).svg', alt: 'Sessions' },
        { name: 'Frame (1) - Audio', src: '/Frame (1).svg', alt: 'Audio' },
        { name: 'Frame - Images', src: '/Frame.svg', alt: 'Images' },
        { name: 'Frame 2', src: '/Frame 2.svg', alt: 'Frame 2' },
        { name: 'Frame 3', src: '/Frame 3.svg', alt: 'Frame 3' },
        { name: 'Frame 4', src: '/Frame 4.svg', alt: 'Frame 4' },
        { name: 'Frame 5', src: '/Frame 5.svg', alt: 'Frame 5' },
    ];

    return (
        <Box sx={{ p: 4, bgcolor: 'white' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Logo Test - Static Assets
            </Typography>
            <Grid container spacing={3}>
                {logos.map((logo, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box sx={{
                            p: 2,
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            textAlign: 'center'
                        }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {logo.name}
                            </Typography>
                            <Box
                                component="img"
                                src={logo.src}
                                alt={logo.alt}
                                sx={{
                                    width: 64,
                                    height: 64,
                                    objectFit: 'contain',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: 1
                                }}
                                onError={(e) => {
                                    console.error(`Failed to load logo: ${logo.src}`);
                                    e.currentTarget.style.border = '2px solid red';
                                }}
                                onLoad={() => {
                                    console.log(`Successfully loaded logo: ${logo.src}`);
                                }}
                            />
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                {logo.src}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
} 