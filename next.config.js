/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    DIFY_API_KEY: process.env.DIFY_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
    ],
  },
};

module.exports = nextConfig;

