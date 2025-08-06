/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    images: {
        unoptimized: true,
        remotePatterns: [],
        domains: [],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    // Ensure static assets are properly served
    assetPrefix: '',
    trailingSlash: false,
    // Optimize static asset handling
    experimental: {
        optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    },
}

module.exports = nextConfig 