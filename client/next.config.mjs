import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.2.29',
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: ['192.168.2.29:3000', 'localhost:3000'],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3001/uploads/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
