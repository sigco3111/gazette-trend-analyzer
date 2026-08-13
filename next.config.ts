import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages 정적 export (Vercel 사용 이력 — 2026-08 Pages로 전환)
  // Pages용: basePath '/gazette-trend-analyzer' / Vercel용: basePath '' (root context)
  // 환경변수로 분기 (P34 패턴)
  basePath: process.env.VERCEL ? '' : '/gazette-trend-analyzer',
  output: 'export',
  trailingSlash: true,
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
