/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    DIFY_API_KEY: process.env.DIFY_API_KEY,
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
};

export default nextConfig;
