/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : '',
      },
    ],
  },
}

module.exports = nextConfig 