import type { ActionResult } from './actions';

/**
 * 챗봇 액션 버튼 타입
 * 
 * 사용자에게 제시되는 버튼 형태의 액션을 정의합니다.
 */
export type ChatbotAction = {
  /** 액션 타입 (현재는 'button'만 지원) */
  type: 'button';
  /** 버튼에 표시될 레이블 */
  label: string;
  /** 버튼 선택 시 전달될 값 */
  value: string;
};

/**
 * OpenSearch Assistant가 제안한 액션 타입
 * 
 * AI 에이전트가 사용자에게 실행을 제안하는 보안 조치 액션입니다.
 */
export type ProposedAction = {
  /** 액션 ID (예: 'list-processes', 'host-isolate') */
  action: string;
  /** 액션 실행에 필요한 파라미터 */
  params: Record<string, unknown>;
  /** 사용자에게 표시될 액션 설명 */
  description: string;
  /** 실행될 PowerShell 명령어 (선택 사항) */
  command?: string;
};

/**
 * 챗봇 메시지 타입
 * 
 * 대화 내역에 저장되는 각 메시지를 나타냅니다.
 * 사용자 입력과 AI 응답을 모두 포함합니다.
 */
export type ChatbotMessage = {
  /** 메시지 타입: 'input' (사용자), 'output' (AI) */
  type: 'input' | 'output';
  /** 콘텐츠 타입: 'text' 또는 'markdown' */
  contentType: 'text' | 'markdown';
  /** 메시지 내용 */
  content: string;
  /** 메시지 고유 ID */
  messageId: string;
  /** OpenSearch Assistant interaction ID (trace 버튼 노출용) */
  interactionId?: string;
  /** 제안된 액션 목록 (문자열 배열) */
  suggestedActions?: string[];
  /** 액션 버튼 목록 */
  actions?: ChatbotAction[];
  /** Agent가 제안한 액션 */
  proposedAction?: ProposedAction;
  /** 액션 실행 결과 */
  actionResult?: ActionResult;
  /** 메시지 생성 시각 (ISO8601 형식) */
  createdAt?: string;
};

/**
 * 챗봇 메시지 전송 요청 타입
 * 
 * OpenSearch Assistant API로 메시지를 전송할 때 사용되는 요청 형식입니다.
 */
export type ChatbotRequest = {
  /** 이전 대화 내역 메시지들 */
  messages: ChatbotMessage[];
  /** 현재 전송할 입력 메시지 */
  input: {
    /** 메시지 타입 (항상 'input') */
    type: 'input';
    /** 메시지 내용 */
    content: string;
    /** 콘텐츠 타입 (현재는 'text'만 지원) */
    contentType: 'text';
    /** 컨텍스트 정보 (앱 ID 등) */
    context: { appId: string };
  };
  /** 대화 ID (기존 대화 이어가기) */
  conversationId?: string;
};

/**
 * OpenSearch Assistant의 상호작용(interaction) 타입
 * 
 * OpenSearch ML Plugin의 Assistant interaction을 나타냅니다.
 * trace 기능에서 사용되며, AI의 내부 처리 과정을 추적할 수 있습니다.
 */
export type AssistantInteraction = {
  /** Interaction 고유 ID */
  id?: string;
  /** 입력 메시지 */
  input?: string;
  /** 출력 메시지 */
  output?: string;
  /** 기타 추가 속성들 */
  [key: string]: unknown;
};

/**
 * 챗봇 메시지 응답 타입
 * 
 * OpenSearch Assistant API로부터 받은 응답 형식입니다.
 */
export type ChatbotResponse = {
  /** 응답 메시지 목록 */
  messages: ChatbotMessage[];
  /** Assistant interaction 목록 (trace용) */
  interactions: AssistantInteraction[];
  /** 대화 ID */
  conversationId: string;
  /** 대화 제목 */
  title: string;
};
