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
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
          path: false,
        };
      }
      return config;
    },
  };
  
  module.exports = nextConfig;