import type { NextConfig } from "next";

// 환경 분기 (P34 패턴):
//   Vercel 빌드: output: Ǹone (SSR/API 지원, basePath Ǹone)
//   Pages 빌드: output: 'export' + basePath '/<repo>' + trailingSlash
const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  basePath: isVercel ? '' : '/gazette-trend-analyzer',
  output: isVercel ? undefined : 'export',
  trailingSlash: !isVercel,
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
