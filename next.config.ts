import type { NextConfig } from 'next';

// Content-Security-Policy is intentionally omitted for now. The app uses
// Tailwind (which may emit inline styles) and a <canvas> element for the
// vigilance game. Add CSP after auditing all inline style/script sources and
// confirming that 'unsafe-inline' is not required.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        // Apply to every route, including API routes and static assets.
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
