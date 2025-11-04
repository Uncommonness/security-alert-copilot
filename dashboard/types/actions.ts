/**
 * 액션 실행 결과 타입 정의
 * 
 * OpenSearch Assistant가 제안한 액션을 사용자가 승인하여 실행한 결과를 나타냅니다.
 * 시뮬레이션 모드와 실제 실행 모드를 모두 지원합니다.
 * 
 * @example
 * ```typescript
 * const result: ActionResult = {
 *   success: true,
 *   action: 'list-processes',
 *   command: 'Get-Process | Select-Object -First 10',
 *   output: '프로세스 목록...',
 *   auditId: 'AUDIT-1234567890',
 *   timestamp: '2025-01-01T00:00:00Z',
 *   simulation: false
 * };
 * ```
 */
export type ActionResult = {
  /** 액션 실행 성공 여부 */
  success: boolean;
  /** 실행된 액션 ID (예: 'list-processes', 'host-isolate') */
  action: string;
  /** 실행된 PowerShell 명령어 */
  command?: string;
  /** 명령어 실행 결과 출력 */
  output?: string;
  /** 실행 중 발생한 오류 메시지 */
  error?: string;
  /** 감사 추적을 위한 고유 ID */
  auditId?: string;
  /** 시뮬레이션 모드로 실행되었는지 여부 */
  simulation?: boolean;
  /** 액션 실행 시각 (ISO8601 형식) */
  timestamp?: string;
  /** 액션 실행 시 전달된 파라미터 */
  params?: Record<string, unknown>;
  /** 추가 상세 정보 */
  details?: string;
  /** 표준 출력 */
  stdout?: string;
  /** 표준 오류 출력 */
  stderr?: string;
  /** 실제로 실행되었는지 여부 (시뮬레이션과 구분) */
  executed?: boolean;
  /** 사용자에게 표시할 참고 사항 */
  note?: string;
};

/**
 * 허용된 액션 타입 정의
 * 
 * 시스템에서 실행 가능한 보안 조치 액션의 종류를 나타냅니다.
 * 각 액션은 화이트리스트 방식으로 관리되며, 위험한 액션은 시뮬레이션만 지원합니다.
 */
export type ActionType =
  | 'host-isolate'        // 호스트 격리 (시뮬레이션만)
  | 'process-kill'        // 프로세스 종료 (시뮬레이션만)
  | 'network-block'       // 네트워크 차단 (시뮬레이션만)
  | 'hash-block'          // 해시 차단 (시뮬레이션만)
  | 'list-processes'       // 프로세스 목록 조회 (실제 실행 가능)
  | 'system-info'         // 시스템 정보 조회 (실제 실행 가능)
  | 'network-connections'; // 네트워크 연결 상태 조회 (실제 실행 가능)

/**
 * 액션 파라미터 타입 정의
 * 
 * 각 액션 타입에 따라 필요한 파라미터를 정의합니다.
 * Union 타입을 사용하여 액션별로 다른 파라미터 구조를 지원합니다.
 */
export type ActionParams =
  | { hostname?: string }                                                    // host-isolate: 격리할 호스트명
  | { pid?: string | number; pid_str?: string; hostname?: string }         // process-kill: 종료할 프로세스 ID
  | { ip?: string; port?: string | number }                                  // network-block: 차단할 IP 주소와 포트
  | { hash?: string }                                                        // hash-block: 차단할 파일 해시
  | { name?: string }                                                        // list-processes: 조회할 프로세스 이름 (선택)
  | Record<string, never>;                                                    // 파라미터가 없는 액션

/**
 * 액션 설정 타입
 * 
 * 각 액션의 실행 방식을 정의합니다.
 * 
 * @property command - PowerShell 명령어 생성 함수 또는 문자열
 * @property description - 사용자에게 표시될 액션 설명
 * @property requiresApproval - 사용자 승인 필수 여부
 * @property allowLocalExecution - 로컬 PC에서 실제 실행 허용 여부 (false면 시뮬레이션만)
 */
export type ActionConfig = {
  /** PowerShell 명령어 생성 함수 또는 고정 문자열 */
  command: ((params: ActionParams) => string) | string;
  /** 사용자에게 표시될 액션 설명 */
  description: string;
  /** 사용자 승인이 필요한지 여부 (현재는 항상 true) */
  requiresApproval: boolean;
  /** 로컬 PC에서 실제 실행을 허용하는지 여부 */
  allowLocalExecution: boolean;
};

