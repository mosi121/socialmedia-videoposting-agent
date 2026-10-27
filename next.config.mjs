/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Support heavy video uploads
    },
  },
};

export default nextConfig;
