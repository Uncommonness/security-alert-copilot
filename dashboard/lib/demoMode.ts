/**
 * 데모 모드 유틸리티
 * 
 * 포트폴리오용으로 OpenSearch 없이도 동작하도록 Mock 데이터를 제공합니다.
 */

/**
 * 데모 모드 활성화 여부 확인
 * 
 * 다음 조건 중 하나라도 만족하면 데모 모드로 동작:
 * 1. PORTFOLIO_MODE 환경변수가 'true'
 * 2. OPENSEARCH_DASHBOARDS_URL이 설정되지 않음
 */
export function isDemoMode(): boolean {
  if (process.env.PORTFOLIO_MODE === 'true') {
    return true;
  }
  
  if (!process.env.OPENSEARCH_DASHBOARDS_URL) {
    return true;
  }
  
  return false;
}

/**
 * 데모 모드일 때 경고 로그 출력 (개발 환경에서만)
 */
export function logDemoMode(apiName: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEMO MODE] ${apiName} - Returning mock data`);
  }
}

