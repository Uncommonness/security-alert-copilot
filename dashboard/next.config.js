const createNextIntlPlugin = require('next-intl/plugin');
const fs = require('fs');
const path = require('path');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

// CA 인증서 경로 설정 (환경 변수에서 상대 경로를 절대 경로로 변환)
const caRelativePath = process.env.NODE_EXTRA_CA_CERTS;
if (caRelativePath) {
  const caAbsolutePath = path.resolve(__dirname, caRelativePath);
  
  if (fs.existsSync(caAbsolutePath)) {
    process.env.NODE_EXTRA_CA_CERTS = caAbsolutePath;
    console.log('CA 인증서 경로 설정:', caAbsolutePath);
  } else {
    console.warn('CA 인증서 파일을 찾을 수 없습니다:', caAbsolutePath);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 포트폴리오/프로덕션 빌드에서 브라우저 소스맵 비활성화로 번들 누출 최소화
  productionBrowserSourceMaps: false,
  images: {
    domains: ['fonts.gstatic.com'],
  },
  webpack: (config, { isServer }) => {
    // 개발 환경에서만 비교적 가벼운 소스맵 사용, 프로덕션은 Next 기본값(비활성화)에 따름
    if (process.env.NODE_ENV === 'development') {
      config.devtool = 'cheap-module-source-map';
    } else {
      config.devtool = false;
    }
    // 청크 분할은 Next 기본 최적화 사용 (커스텀 제거)
    return config;
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/navigator-layer',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' }
        ]
      },
      {
        source: '/mitre-attack/navigator-layer.json',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' }
        ]
      }
    ]
  },
}

module.exports = withNextIntl(nextConfig); 
