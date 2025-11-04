/**
 * 알람(Alert) API 서비스
 * 
 * 보안 경보/알람 데이터를 조회하는 API 함수를 제공합니다.
 */

import type { AlertsResponse, SearchAfterToken } from '@/types/alerts';

/**
 * 알람 조회 파라미터 타입
 */
export type FetchAlertsParams = {
  /** 조회할 항목 수 */
  size: number;
  /** 시작 시각 (ISO8601 형식) */
  start_time?: string;
  /** 종료 시각 (ISO8601 형식) */
  end_time?: string;
  /** 페이지네이션을 위한 search_after 토큰 */
  search_after?: SearchAfterToken[];
};

/**
 * 알람 목록을 조회합니다.
 * 
 * @param params - 조회 파라미터
 * @param baseURL - API 서버 기본 URL (선택 사항)
 * @returns 알람 응답 데이터
 * 
 * @throws {Error} API 요청 실패 시 에러 발생
 * 
 * @example
 * ```typescript
 * const alerts = await fetchAlerts({
 *   size: 10,
 *   start_time: '2025-01-01T00:00:00Z',
 *   end_time: '2025-01-02T00:00:00Z'
 * });
 * ```
 */
export async function fetchAlerts(
  params: FetchAlertsParams,
  baseURL?: string
): Promise<AlertsResponse> {
  const url =
    (baseURL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      'http://localhost:8080') + '/api/v1/alerts';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      size: params.size,
      start_time: params.start_time,
      end_time: params.end_time,
      search_after: params.search_after,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    const message =
      json?.error?.message ?? `Failed to fetch alerts (${res.status})`;
    throw new Error(message);
  }

  return json as AlertsResponse;
}

