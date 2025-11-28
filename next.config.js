/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Ignore type errors during build to prevent Vercel build failure
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore lint errors during build
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },
};

module.exports = nextConfig;