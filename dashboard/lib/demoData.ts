/**
 * 데모 모드용 Mock 데이터
 * 
 * 포트폴리오 배포 시 OpenSearch 없이도 동작하도록 샘플 데이터를 제공합니다.
 */

import type { ChatbotMessage, ChatbotResponse } from '@/types/chatbot';
import type { ConversationSummary } from '@/app/components/chatbot/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * interactionId와 사용자 메시지/응답 매핑 (메모리 저장소)
 */
const interactionMessageMap = new Map<string, {
  userMessage: string;
  aiResponse: string;
}>();

/**
 * interactionId와 사용자 메시지/응답을 저장
 */
export function storeInteractionMessage(interactionId: string, userMessage: string, aiResponse: string) {
  interactionMessageMap.set(interactionId, {
    userMessage,
    aiResponse,
  });
  // 메모리 누수 방지: 1시간 이상 된 항목 제거
  const oneHourAgo = Date.now() - 3600000;
  // 간단한 정리 로직은 생략 (필요시 추가)
}

/**
 * interactionId로 사용자 메시지 조회
 */
export function getUserMessageByInteractionId(interactionId: string): string | null {
  const data = interactionMessageMap.get(interactionId);
  return data?.userMessage || null;
}

/**
 * interactionId로 AI 응답 조회
 */
export function getAIResponseByInteractionId(interactionId: string): string | null {
  const data = interactionMessageMap.get(interactionId);
  return data?.aiResponse || null;
}

/**
 * 질문 타입 결정 (generateDemoResponse와 동일한 로직)
 */
export function determineQuestionType(userMessage: string): number {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('ws-023') || lowerMessage.includes('24h') || lowerMessage.includes('요약')) {
    return 1; // WS-023 요약
  }
  if (lowerMessage.includes('심각도') || lowerMessage.includes('high') || lowerMessage.includes('알람')) {
    return 3; // High 심각도 알람
  }
  if (lowerMessage.includes('powershell') || lowerMessage.includes('명령') || lowerMessage.includes('조사')) {
    return 4; // PowerShell 조사
  }
  if (lowerMessage.includes('안녕') || lowerMessage.length < 10) {
    return 0; // 간단한 인사말
  }
  
  return 2; // 기본: 최근 보안 위협
}

/**
 * 샘플 인덱스 목록 (OpenSearch 인덱스 데모)
 */
export const DEMO_INDICES = [
  'alerts-sim-2025.10.27',
  'alerts-sim-2025.10.28',
  'alerts-sim-2025.10.29',
  'events-sim-2025.10.27',
  'events-sim-2025.10.28',
  'events-sim-2025.10.29',
  'intel-sim',
  'kb-sim',
];

/**
 * 데모 대화 목록 (과거 대화 내역)
 */
export const DEMO_CONVERSATIONS: ConversationSummary[] = [
  {
    id: 'demo-conv-1',
    title: 'WS-023 지난 24h 요약',
    createdTimeMs: Date.now() - 86400000, // 1일 전
    updatedTimeMs: Date.now() - 86400000,
  },
  {
    id: 'demo-conv-2',
    title: '심각도 high인 알람 분석',
    createdTimeMs: Date.now() - 172800000, // 2일 전
    updatedTimeMs: Date.now() - 172800000,
  },
  {
    id: 'demo-conv-3',
    title: 'PowerShell 암호화 명령어 조사',
    createdTimeMs: Date.now() - 259200000, // 3일 전
    updatedTimeMs: Date.now() - 259200000,
  },
];

/**
 * 더미 대화 내역의 interactionId와 메시지/응답을 미리 초기화
 */
function initializeDemoConversationMessages() {
  // 고정된 interactionId 사용 (서버 재시작 시에도 동일하게 유지)
  const interactionId1 = 'demo-interaction-conv-1';
  const interactionId2 = 'demo-interaction-conv-2';
  const interactionId3 = 'demo-interaction-conv-3';
  
  // demo-conv-1: WS-023 지난 24h 요약
  const userMessage1 = 'WS-023 지난 24h 요약';
  const aiResponse1 = `## WS-023 호스트 분석 결과 (지난 24시간)

### 📊 요약
지난 24시간 동안 **WS-023** 호스트에서 **5건의 보안 알람**이 탐지되었습니다.

### 🔍 주요 알람
1. **ALRT-20251029-001234** - PowerShell Base64 인코딩 명령 실행
   - 심각도: **High**
   - 시간: 2025-10-29 02:15:23
   - MITRE ATT&CK: T1059.001 (PowerShell)

2. **ALRT-20251029-001235** - 의심스러운 네트워크 연결
   - 심각도: **Medium**
   - 시간: 2025-10-29 03:42:11
   - 도메인: \`msupdate-cdn.example.net\`

3. **ALRT-20251029-001236** - 프로세스 체인 분석 결과
   - 심각도: **Medium**
   - 시간: 2025-10-29 04:28:55

### 💡 권장 조치
- 호스트 격리 검토
- PowerShell 실행 로그 추가 분석
- 네트워크 트래픽 패턴 확인

*이 분석은 데모 모드에서 생성된 샘플 데이터입니다.*`;
  storeInteractionMessage(interactionId1, userMessage1, aiResponse1);
  
  // demo-conv-2: 심각도 high인 알람 분석
  const userMessage2 = '심각도 high인 알람 분석해줘';
  const aiResponse2 = `## 🔴 High 심각도 알람 분석

### 탐지된 High 알람: **3건**

1. **ALRT-20251029-001234**
   - 호스트: WS-023
   - 규칙: PowerShell Base64 인코딩 실행
   - 기술: T1059.001
   - 시간: 2025-10-29 02:15:23

2. **ALRT-20251029-002456**
   - 호스트: WS-045
   - 규칙: 의심스러운 프로세스 체인
   - 기술: T1055 (Process Injection)
   - 시간: 2025-10-29 01:30:12

3. **ALRT-20251029-003789**
   - 호스트: WS-078
   - 규칙: 네트워크 익스필트레이션 시도
   - 기술: T1041 (Exfiltration Over C2 Channel)
   - 시간: 2025-10-29 00:45:33

### 권장 조치
- 즉시 호스트 격리 검토
- 추가 포렌식 분석 수행
- 네트워크 세그멘테이션 확인

*이 분석은 데모 모드에서 생성된 샘플 데이터입니다.*`;
  storeInteractionMessage(interactionId2, userMessage2, aiResponse2);
  
  // demo-conv-3: PowerShell 명령어 조사
  const userMessage3 = 'PowerShell 명령어 조사해줘';
  const aiResponse3 = `## PowerShell 암호화 명령어 분석

### 🔍 발견된 의심 활동
호스트 **WS-023**에서 PowerShell Base64 인코딩 명령이 실행되었습니다.

**실행 명령어:**
\`\`\`powershell
powershell.exe -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMAuQBUAEMAUABDAGwAaQBlAG4AdAAuLi4=
\`\`\`

### 📋 조사 단계

#### 1. 프로세스 체인 분석
- 부모 프로세스: \`explorer.exe\` (PID: 1234)
- 자식 프로세스: \`powershell.exe\` (PID: 5678)
- 실행 경로: \`C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\`

#### 2. 네트워크 연결 확인
- 대상 IP: \`192.168.1.100:443\`
- 프로토콜: TCP
- 상태: ESTABLISHED

#### 3. 파일 활동
- 생성된 임시 파일: \`C:\\Users\\User\\AppData\\Temp\\tmp_*.tmp\`
- 의심 파일 해시: \`SHA256: abc123...\`

### 💡 권장 조치

다음 조치를 제안합니다:
1. **호스트 격리**: 추가 확산 방지
2. **프로세스 종료**: 의심스러운 PowerShell 프로세스 종료
3. **네트워크 차단**: 외부 연결 차단

*이 분석은 데모 모드에서 생성된 샘플 데이터입니다.*

---

**실제 조치를 실행하시겠습니까?**`;
  storeInteractionMessage(interactionId3, userMessage3, aiResponse3);
}

// 모듈 로드 시 더미 대화 내역 메시지 초기화
if (typeof window === 'undefined') {
  // 서버 사이드에서만 실행
  initializeDemoConversationMessages();
}

/**
 * 데모 응답 생성기
 * 
 * 사용자 질문에 따라 적절한 데모 응답을 생성합니다.
 */
export function generateDemoResponse(
  userMessage: string,
  conversationId?: string
): ChatbotResponse {
  const lowerMessage = userMessage.toLowerCase();
  const now = new Date();
  
  // 질문 패턴에 따라 다른 응답 반환
  if (lowerMessage.includes('ws-023') || lowerMessage.includes('24h') || lowerMessage.includes('요약')) {
    const interactionId = `demo-interaction-${Date.now()}`;
    return {
      conversationId: conversationId || `demo-conv-${Date.now()}`,
      title: 'WS-023 지난 24h 요약',
      interactions: [{ id: interactionId, input: userMessage }],
      messages: [
        {
          messageId: uuidv4(),
          type: 'output',
          contentType: 'markdown',
          content: `## WS-023 호스트 분석 결과 (지난 24시간)

### 📊 요약
지난 24시간 동안 **WS-023** 호스트에서 **5건의 보안 알람**이 탐지되었습니다.

### 🔍 주요 알람
1. **ALRT-20251029-001234** - PowerShell Base64 인코딩 명령 실행
   - 심각도: **High**
   - 시간: 2025-10-29 02:15:23
   - MITRE ATT&CK: T1059.001 (PowerShell)

2. **ALRT-20251029-001235** - 의심스러운 네트워크 연결
   - 심각도: **Medium**
   - 시간: 2025-10-29 03:42:11
   - 도메인: \`msupdate-cdn.example.net\`

3. **ALRT-20251029-001236** - 프로세스 체인 분석 결과
   - 심각도: **Medium**
   - 시간: 2025-10-29 04:28:55

### 💡 권장 조치
- 호스트 격리 검토
- PowerShell 실행 로그 추가 분석
- 네트워크 트래픽 패턴 확인

*이 분석은 데모 모드에서 생성된 샘플 데이터입니다.*`,
          createdAt: now.toISOString(),
          interactionId,
        },
      ],
    };
  }
  
  if (lowerMessage.includes('심각도') || lowerMessage.includes('high') || lowerMessage.includes('알람')) {
    const interactionId = `demo-interaction-${Date.now()}`;
    return {
      conversationId: conversationId || `demo-conv-${Date.now()}`,
      title: 'High 심각도 알람 분석',
      interactions: [{ id: interactionId, input: userMessage }],
      messages: [
        {
          messageId: uuidv4(),
          type: 'output',
          contentType: 'markdown',
          content: `## 🔴 High 심각도 알람 분석

### 탐지된 High 알람: **3건**

1. **ALRT-20251029-001234**
   - 호스트: WS-023
   - 규칙: PowerShell Base64 인코딩 실행
   - 기술: T1059.001
   - 시간: 2025-10-29 02:15:23

2. **ALRT-20251029-002456**
   - 호스트: WS-045
   - 규칙: 의심스러운 프로세스 체인
   - 기술: T1055 (Process Injection)
   - 시간: 2025-10-29 01:30:12

3. **ALRT-20251029-003789**
   - 호스트: WS-078
   - 규칙: 네트워크 익스필트레이션 시도
   - 기술: T1041 (Exfiltration Over C2 Channel)
   - 시간: 2025-10-29 00:45:33

### 권장 조치
- 즉시 호스트 격리 검토
- 추가 포렌식 분석 수행
- 네트워크 세그멘테이션 확인

*이 분석은 데모 모드에서 생성된 샘플 데이터입니다.*`,
          createdAt: now.toISOString(),
          interactionId,
        },
      ],
    };
  }
  
  if (lowerMessage.includes('powershell') || lowerMessage.includes('명령') || lowerMessage.includes('조사')) {
    const interactionId = `demo-interaction-${Date.now()}`;
    return {
      conversationId: conversationId || `demo-conv-${Date.now()}`,
      title: 'PowerShell 명령어 조사',
      interactions: [{ id: interactionId, input: userMessage }],
      messages: [
        {
          messageId: uuidv4(),
          type: 'output',
          contentType: 'markdown',
          content: `## PowerShell 암호화 명령어 분석

### 🔍 발견된 의심 활동
호스트 **WS-023**에서 PowerShell Base64 인코딩 명령이 실행되었습니다.

**실행 명령어:**
\`\`\`powershell
powershell.exe -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMAuQBUAEMAUABDAGwAaQBlAG4AdAAuLi4=
\`\`\`

### 📋 조사 단계

#### 1. 프로세스 체인 분석
- 부모 프로세스: \`explorer.exe\` (PID: 1234)
- 자식 프로세스: \`powershell.exe\` (PID: 5678)
- 실행 경로: \`C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\`

#### 2. 네트워크 연결 확인
- 대상 IP: \`192.168.1.100:443\`
- 프로토콜: TCP
- 상태: ESTABLISHED

#### 3. 파일 활동
- 생성된 임시 파일: \`C:\\Users\\User\\AppData\\Temp\\tmp_*.tmp\`
- 의심 파일 해시: \`SHA256: abc123...\`

### 💡 권장 조치

다음 조치를 제안합니다:
1. **호스트 격리**: 추가 확산 방지
2. **프로세스 종료**: 의심스러운 PowerShell 프로세스 종료
3. **네트워크 차단**: 외부 연결 차단

*이 분석은 데모 모드에서 생성된 샘플 데이터입니다.*

---

**실제 조치를 실행하시겠습니까?**`,
          createdAt: now.toISOString(),
          interactionId,
          proposedAction: {
            action: 'host-isolate',
            description: '호스트 격리 (시뮬레이션)',
            params: { hostname: 'WS-023' },
          },
        },
      ],
    };
  }
  
  // 기본 응답
  const defaultInteractionId = `demo-interaction-${Date.now()}`;
  return {
    conversationId: conversationId || `demo-conv-${Date.now()}`,
    title: '새 대화',
    interactions: [{ id: defaultInteractionId, input: userMessage }],
    messages: [
      {
        messageId: uuidv4(),
        type: 'output',
        contentType: 'markdown',
        content: `안녕하세요! Security Alert Copilot입니다. 👋

저는 보안 알람을 분석하고 조치 방안을 제안하는 AI 어시스턴트입니다.

### 사용 가능한 기능:
- **알람 요약**: "WS-023 지난 24h 요약"
- **심각도별 분석**: "심각도 high인 알람들"
- **조사 지원**: "PowerShell 명령어 조사해줘"
- **액션 제안**: 위협에 대한 조치 방안 제공

### 데모 모드
현재 데모 모드로 동작 중입니다. 실제 OpenSearch 서버에 연결되지 않았으며, 샘플 데이터를 기반으로 응답합니다.

어떤 알람을 분석해드릴까요?`,
          createdAt: now.toISOString(),
          interactionId: defaultInteractionId,
        },
      ],
    };
}


/**
 * 데모 대화 내역 생성
 */
export function getDemoConversation(id: string): {
  id: string;
  title: string;
  messages: ChatbotMessage[];
  createdTimeMs: number;
  updatedTimeMs: number;
} {
  const baseTime = Date.now() - 86400000; // 1일 전
  
  if (id === 'demo-conv-1') {
    return {
      id: 'demo-conv-1',
      title: 'WS-023 지난 24h 요약',
      createdTimeMs: baseTime,
      updatedTimeMs: baseTime,
      messages: [
        {
          messageId: uuidv4(),
          type: 'input',
          contentType: 'text',
          content: 'WS-023 지난 24h 요약',
          createdAt: new Date(baseTime).toISOString(),
        },
        {
          messageId: uuidv4(),
          type: 'output',
          contentType: 'markdown',
          content: `## WS-023 호스트 분석 결과 (지난 24시간)

### 📊 요약
지난 24시간 동안 **WS-023** 호스트에서 **5건의 보안 알람**이 탐지되었습니다.

### 🔍 주요 알람
1. **ALRT-20251029-001234** - PowerShell Base64 인코딩 명령 실행
   - 심각도: **High**
   - 시간: 2025-10-29 02:15:23
   - MITRE ATT&CK: T1059.001 (PowerShell)

2. **ALRT-20251029-001235** - 의심스러운 네트워크 연결
   - 심각도: **Medium**
   - 시간: 2025-10-29 03:42:11
   - 도메인: \`msupdate-cdn.example.net\`

*이 분석은 데모 모드에서 생성된 샘플 데이터입니다.*`,
          createdAt: new Date(baseTime + 5000).toISOString(),
          interactionId: 'demo-interaction-conv-1',
        },
      ],
    };
  }
  
  if (id === 'demo-conv-2') {
    return {
      id: 'demo-conv-2',
      title: '심각도 high인 알람 분석',
      createdTimeMs: Date.now() - 172800000,
      updatedTimeMs: Date.now() - 172800000,
      messages: [
        {
          messageId: uuidv4(),
          type: 'input',
          contentType: 'text',
          content: '심각도 high인 알람 분석해줘',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          messageId: uuidv4(),
          type: 'output',
          contentType: 'markdown',
          content: `## 🔴 High 심각도 알람 분석

### 탐지된 High 알람: **3건**

1. **ALRT-20251029-001234**
   - 호스트: WS-023
   - 규칙: PowerShell Base64 인코딩 실행
   - 기술: T1059.001
   - 시간: 2025-10-29 02:15:23

2. **ALRT-20251029-002456**
   - 호스트: WS-045
   - 규칙: 의심스러운 프로세스 체인
   - 기술: T1055 (Process Injection)
   - 시간: 2025-10-29 01:30:12

3. **ALRT-20251029-003789**
   - 호스트: WS-078
   - 규칙: 네트워크 익스필트레이션 시도
   - 기술: T1041 (Exfiltration Over C2 Channel)
   - 시간: 2025-10-29 00:45:33

### 권장 조치
- 즉시 호스트 격리 검토
- 추가 포렌식 분석 수행
- 네트워크 세그멘테이션 확인

*이 분석은 데모 모드에서 생성된 샘플 데이터입니다.*`,
          createdAt: new Date(Date.now() - 172800000 + 5000).toISOString(),
          interactionId: 'demo-interaction-conv-2',
        },
      ],
    };
  }
  
  if (id === 'demo-conv-3') {
    return {
      id: 'demo-conv-3',
      title: 'PowerShell 암호화 명령어 조사',
      createdTimeMs: Date.now() - 259200000,
      updatedTimeMs: Date.now() - 259200000,
      messages: [
        {
          messageId: uuidv4(),
          type: 'input',
          contentType: 'text',
          content: 'PowerShell 명령어 조사해줘',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
        },
        {
          messageId: uuidv4(),
          type: 'output',
          contentType: 'markdown',
          content: `## PowerShell 암호화 명령어 분석

### 🔍 발견된 의심 활동
호스트 **WS-023**에서 PowerShell Base64 인코딩 명령이 실행되었습니다.

**실행 명령어:**
\`\`\`powershell
powershell.exe -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMAuQBUAEMAUABDAGwAaQBlAG4AdAAuLi4=
\`\`\`

### 📋 조사 단계

#### 1. 프로세스 체인 분석
- 부모 프로세스: \`explorer.exe\` (PID: 1234)
- 자식 프로세스: \`powershell.exe\` (PID: 5678)
- 실행 경로: \`C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\`

#### 2. 네트워크 연결 확인
- 대상 IP: \`192.168.1.100:443\`
- 프로토콜: TCP
- 상태: ESTABLISHED

#### 3. 파일 활동
- 생성된 임시 파일: \`C:\\Users\\User\\AppData\\Temp\\tmp_*.tmp\`
- 의심 파일 해시: \`SHA256: abc123...\`

### 💡 권장 조치

다음 조치를 제안합니다:
1. **호스트 격리**: 추가 확산 방지
2. **프로세스 종료**: 의심스러운 PowerShell 프로세스 종료
3. **네트워크 차단**: 외부 연결 차단

*이 분석은 데모 모드에서 생성된 샘플 데이터입니다.*

---

**실제 조치를 실행하시겠습니까?**`,
          createdAt: new Date(Date.now() - 259200000 + 5000).toISOString(),
          interactionId: 'demo-interaction-conv-3',
          proposedAction: {
            action: 'host-isolate',
            description: '호스트 격리 (시뮬레이션)',
            params: { hostname: 'WS-023' },
          },
        },
      ],
    };
  }
  
  // 기본 데모 대화 (새로 생성된 대화)
  return {
    id,
    title: '새 대화',
    createdTimeMs: Date.now(),
    updatedTimeMs: Date.now(),
    messages: [],
  };
}

