/**
 * 알람(Alert) 관련 타입 정의
 * 
 * 보안 경보 및 알람 데이터 구조를 정의합니다.
 */

/**
 * MITRE ATT&CK 기술(Technique) 타입
 */
export type MitreTechnique = {
  /** 기술 ID (예: T1005) */
  id: string;
  /** 기술 이름 */
  name: string;
  /** 기술 상세 페이지 URL */
  url: string;
};

/**
 * MITRE ATT&CK 전술(Tactic) 타입
 */
export type MitreTactic = {
  /** 전술 ID (예: TA0001) */
  id: string;
  /** 전술 짧은 이름 */
  short_name: string;
  /** 전술 전체 이름 */
  name: string;
  /** 전술 상세 페이지 URL */
  url: string;
};

/**
 * 검색 후 토큰 타입
 * 
 * 페이지네이션을 위한 OpenSearch search_after 파라미터
 * 일반적으로 문자열 또는 숫자의 배열
 */
export type SearchAfterToken = string | number;

/**
 * 이벤트 데이터 타입
 * 
 * 보안 이벤트의 구조화된 데이터를 나타냅니다.
 * 실제 구조는 이벤트 타입에 따라 다를 수 있으므로 Record 타입 사용
 */
export type EventData = Record<string, unknown>;

/**
 * 정렬 토큰 타입
 * 
 * OpenSearch sort 파라미터로 사용되는 정렬 값들
 */
export type SortToken = string | number | boolean | null;

/**
 * 알람 항목 타입
 */
export type AlertItem = {
  /** 알람 정보 */
  alert: {
    /** 관련 문서 ID */
    related_document_id?: string;
    /** 관련 인덱스 이름 */
    related_index_name?: string;
    /** 규칙 ID */
    rule_id?: string;
    /** 규칙 제목 */
    rule_title?: string;
    /** 태그 목록 */
    tags?: string[];
    /** 알람 발생 시각 (ISO8601 형식) */
    timestamp?: string;
    /** 주요 MITRE 기술 */
    primary_technique?: MitreTechnique;
    /** 주요 MITRE 전술 */
    primary_tactic?: MitreTactic;
  };
  /** 관련 이벤트 데이터 (선택 사항) */
  event?: EventData;
  /** 정렬 토큰 (선택 사항) */
  sort?: SortToken[];
};

/**
 * 알람 응답 타입
 */
export type AlertsResponse = {
  /** 알람 항목 배열 */
  data: AlertItem[];
  /** 전체 알람 수 */
  total?: number;
};

