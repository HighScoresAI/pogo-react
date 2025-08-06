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
        unoptimized: false,
        remotePatterns: [],
        domains: [],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    // Ensure static assets are properly served
    assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
    basePath: '',
    trailingSlash: false,
    // Ensure static files are served correctly
    async headers() {
        return [
            {
                source: '/Frame(.*).svg',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                    {
                        key: 'Content-Type',
                        value: 'image/svg+xml',
                    },
                ],
            },
            {
                source: '/hellopogo.png',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                    {
                        key: 'Content-Type',
                        value: 'image/png',
                    },
                ],
            },
        ];
    },
    // Optimize static asset handling
    experimental: {
        optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    },
}

module.exports = nextConfig 