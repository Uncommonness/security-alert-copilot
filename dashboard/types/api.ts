/**
 * 페이지네이션 파라미터
 * 
 * API 요청에서 페이지 번호와 페이지 크기를 지정할 때 사용됩니다.
 */
export interface PaginationParams {
  /** 페이지 번호 (1부터 시작) */
  page: number;
  /** 페이지당 항목 수 */
  size: number;
}

/**
 * 페이지네이션된 응답 타입
 * 
 * 목록 API에서 사용되는 응답 형식입니다.
 * 
 * @template T - 항목 데이터 타입
 */
export interface PaginatedResponse<T> {
  /** 항목 배열 */
  data: T[];
  /** 전체 항목 수 */
  total: number;
}

/**
 * 일반 API 응답 타입
 * 
 * 성공/실패 여부와 데이터를 포함하는 범용 API 응답 형식입니다.
 * 
 * @template T - 응답 데이터 타입
 */
export interface ApiResponse<T> {
  /** 응답 데이터 */
  data: T;
  /** 응답 메시지 (선택 사항) */
  message?: string;
  /** 성공 여부 */
  success: boolean;
}

/**
 * 에러 응답 타입
 * 
 * API 에러가 발생했을 때 반환되는 응답 형식입니다.
 */
export interface ErrorResponse {
  /** 에러 메시지 */
  message: string;
  /** HTTP 상태 코드 */
  status: number;
  /** 에러 발생 시각 (ISO8601 형식) */
  timestamp: string;
}
