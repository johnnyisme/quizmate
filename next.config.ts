import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 開發模式下暫時禁用嚴格的 CSP，允許 KaTeX 運作
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
              : [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
                  "style-src 'self' 'unsafe-inline'",
                  "img-src 'self' data: blob:",
                  "font-src 'self' data:",
                  "connect-src 'self'",
                ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
