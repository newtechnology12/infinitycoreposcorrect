/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
      ignoreDuringBuilds: true, // Ignore ESLint during build
    },
    typescript: {
      ignoreBuildErrors: true, // Ignore TypeScript build errors
    },
    swcMinify: true,
  };
  
  module.exports = nextConfig;