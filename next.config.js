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
      config.devtool = 'source-map'; // Ensure source maps are generated
      return config;
    },
    distDir: 'dist', // Set the output directory to 'dist'
  };
  
  module.exports = nextConfig;