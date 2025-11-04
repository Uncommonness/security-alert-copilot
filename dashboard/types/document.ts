/**
 * 문서 타입
 * 
 * 업로드된 보안 문서의 메타데이터를 나타냅니다.
 */
export type Document = {
  /** 문서 고유 ID */
  id: string;
  /** 원본 파일명 */
  filename: string;
  /** 파일 크기 (바이트) */
  size: number;
  /** 업로드 시각 (ISO8601 형식) */
  uploadedAt: string;
  /** 문서 처리 상태 */
  status: 'processing' | 'indexed' | 'error';
  /** OpenSearch 인덱스 이름 (인덱싱 완료 시) */
  indexName?: string;
  /**
   * 실제 저장된 업로드 파일명
   * 
   * 형식: `${uuid}-${원본파일명}`
   * 삭제 시 정확한 파일 경로 계산을 위해 보관됩니다.
   */
  storedFilename?: string;
};

/**
 * 문서 업로드 응답 타입
 * 
 * 문서 업로드 API의 응답 형식입니다.
 */
export type DocumentUploadResponse = {
  /** 업로드된 문서 ID */
  id: string;
  /** 파일명 */
  filename: string;
  /** 파일 크기 (바이트) */
  size: number;
  /** 업로드 시각 (ISO8601 형식) */
  uploadedAt: string;
  /** 처리 상태 (업로드 직후는 항상 'processing') */
  status: 'processing';
};

/**
 * 문서 목록 응답 타입
 * 
 * 문서 목록 조회 API의 응답 형식입니다.
 */
export type DocumentListResponse = {
  /** 문서 배열 */
  documents: Document[];
  /** 전체 문서 수 */
  total: number;
};

/**
 * 문서 삭제 응답 타입
 * 
 * 문서 삭제 API의 응답 형식입니다.
 */
export type DocumentDeleteResponse = {
  /** 삭제 성공 여부 */
  success: boolean;
  /** 결과 메시지 (선택 사항) */
  message?: string;
};
