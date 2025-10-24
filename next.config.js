/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qtnuhdrhvrmgpljdhfmt.supabase.co',
        pathname: '/storage/v1/**',
      }
    ],
  }
}

module.exports = nextConfig