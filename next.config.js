/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-project-reference.supabase.co'],
  },
}

module.exports = nextConfig 