import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'p3-ancientlib-sign.byteimg.com',
      },
      {
        protocol: 'https',
        hostname: 'p6-ancientlib-sign.byteimg.com',
      },
      {
        protocol: 'https',
        hostname: 'p9-ancientlib-sign.byteimg.com',
      },
      {
        protocol: 'https',
        hostname: 'lf-welfare.amemv.com',
      },
      {
        protocol: 'https',
        hostname: 'lf3-static.bytednsdoc.com',
      },
    ],
  },
}

export default nextConfig
