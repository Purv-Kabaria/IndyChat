/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    DIFY_API_KEY: process.env.DIFY_API_KEY,
  },
};

export default nextConfig;
