/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway.jollydune-c16fc137.eastasia.azurecontainerapps.io',
  },
};
module.exports = nextConfig;
