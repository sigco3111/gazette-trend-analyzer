import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAFAF8",
};

export const metadata: Metadata = {
  title: "관보 트렌드 — 대한민국 정책 흐름 분석",
  description:
    "2020년부터 현재까지의 대한민국 관보 128,000여 건을 분석하여 정책 트렌드, 기관 활동, 키워드 흐름을 시각화합니다.",
  openGraph: {
    title: "관보 트렌드 — 대한민국 정책 흐름 분석",
    description: "관보 128,000건의 정책 트렌드 시각화",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=Noto+Serif+KR:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
