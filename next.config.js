const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence multi-lockfile root inference by pinning the root to this app
  turbopack: {
    root: path.join(__dirname)
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qtnuhdrhvrmgpljdhfmt.supabase.co',
        pathname: '/storage/v1/**',
      }
    ],
  },
  // Allow LAN dev access to _next assets without warnings
  // Adjust or remove as needed for your network
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.160:3000'
  ]
}

module.exports = nextConfig