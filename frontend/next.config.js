/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'd205bpvrqc9yn1.cloudfront.net' },
      // { protocol: 'https', hostname: 'your-other-image-domain.com' },
    ],
  },
  async rewrites() {
    // Use the backend URL provided via env in prod (and when set locally)
    if (API_BASE) {
      return [
        {
          source: '/api/:path*',
          destination: `${API_BASE}/api/:path*`,
        },
      ];
    }
    // Fallback for local development
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4100/api/:path*',
        },
      ];
    }
    // No rewrite in production if the env var isn't set
    return [];
  },
};

module.exports = nextConfig;
