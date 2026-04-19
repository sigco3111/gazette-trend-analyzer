import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache API responses for 10 minutes (data updates daily)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=600, stale-while-revalidate=1200' },
        ],
      },
    ];
  },
};

export default nextConfig;
