/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'd205bpvrqc9yn1.cloudfront.net',
      // Add more domains as needed
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4100/api/:path*', // Proxy to backend
      },
    ];
  },
};

module.exports = nextConfig;
