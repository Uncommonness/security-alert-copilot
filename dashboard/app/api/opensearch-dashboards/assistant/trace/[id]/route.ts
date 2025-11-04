import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { isDemoMode, logDemoMode } from '@/lib/demoMode';
import { getUserMessageByInteractionId, getAIResponseByInteractionId, determineQuestionType } from '@/lib/demoData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const traceId = resolvedParams.id;
  
  // 데모 모드 확인
  if (isDemoMode()) {
    logDemoMode(`assistant/trace/${traceId}`);
    
    // interactionId로 실제 사용자 메시지와 AI 응답 조회
    let userMessage = getUserMessageByInteractionId(traceId);
    let aiResponse = getAIResponseByInteractionId(traceId);
    
    // 찾지 못한 경우 기본값 사용 (기존 대화에서)
    if (!userMessage || !aiResponse) {
      // interactionId에서 타임스탬프 추출 시도
      const timestampMatch = traceId.match(/demo-interaction-(\d+)/);
      const seed = timestampMatch ? parseInt(timestampMatch[1]) : traceId.charCodeAt(traceId.length - 1) || 0;
      const questionType = seed % 5; // 0~4 (인사, WS-023, 최근 위협, High 알람, PowerShell)
      
      // 기본 더미 메시지 (generateDemoResponse와 동일한 응답 사용)
      if (questionType === 1) {
        userMessage = 'WS-023 지난 24h 요약';
        aiResponse = `## WS-023 호스트 분석 결과 (지난 24시간)

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
      } else if (questionType === 2) {
        userMessage = '최근에 발생한 보안 위협 있어?';
        aiResponse = `네, 최근에 발생한 보안 위협이 있습니다. 2025년 10월 29일에 다음과 같은 3건의 알림이 탐지되었습니다:

**높음 (High) 심각도 알림**: \`Suspicious PowerShell EncodedCommand\` (의심스러운 PowerShell 인코딩 명령)이 **2025년 10월 29일 02시 04분 41초 (UTC)**에 호스트 \`SRV-AD-01\`에서 탐지되었습니다. \`powershell.exe\` 프로세스가 \`powershell -enc IEX -Command\`와 같은 인코딩된 명령을 실행했습니다. 관련 해시는 \`sha256:3e6952e7d990edf4\`입니다.

**중간 (Medium) 심각도 알림**: \`Remote Service Execution (PsExec-like)\` (PsExec 유사 원격 서비스 실행)이 **2025년 10월 29일 01시 10분 37초 (UTC)**에 호스트 \`WS-023\`에서 탐지되었습니다. \`psexecsvc.exe\` 프로세스가 \`psexec \\\\SRV-FILE-02 cmd /c whoami\` 명령을 실행하여 \`SRV-FILE-02\`에 대한 측면 이동(Lateral Movement)을 시도했습니다. 관련 해시는 \`sha256:8d0423ae5b94f439\`입니다.

**중간 (Medium) 심각도 알림**: \`Suspicious PowerShell EncodedCommand\` (의심스러운 PowerShell 인코딩 명령)이 **2025년 10월 29일 00시 35분 07초 (UTC)**에 호스트 \`SRV-FILE-02\`에서 탐지되었습니다. \`powershell.exe\` 프로세스가 \`powershell -enc IEX -Command\`와 같은 인코딩된 명령을 실행했습니다. 관련 해시는 \`sha256:3e6952e7d990edf4\`입니다.

이러한 위협에 대해 더 자세한 정보를 원하시거나 특정 조치를 취하기를 원하시나요?`;
      } else if (questionType === 3) {
        userMessage = '심각도 high인 알람 분석해줘';
        aiResponse = `## 🔴 High 심각도 알람 분석

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
      } else if (questionType === 4) {
        userMessage = 'PowerShell 명령어 조사해줘';
        aiResponse = `## PowerShell 암호화 명령어 분석

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
      } else {
        userMessage = '안녕';
        aiResponse = '안녕하세요! Security Alert Copilot입니다. 어떤 보안 관련 도움이 필요하신가요? 제가 시스템 정보를 확인하거나, 네트워크 연결을 분석하거나, 특정 프로세스를 종료하는 등의 작업을 도와드릴 수 있습니다. 어떤 정보를 찾고 계신가요?';
      }
    }
    
    // 사용자 메시지 기반으로 질문 타입 결정 (generateDemoResponse와 동일한 로직)
    // aiResponse는 이미 조회했거나 기본값으로 설정된 실제 응답을 사용
    const questionType = determineQuestionType(userMessage);
    const now = Date.now();
    const isSimple = questionType === 0;
    
    if (isSimple) {
      // 간단한 응답 패턴 (1단계 LLM)
      return NextResponse.json([
        {
          traceNumber: 1,
          origin: 'LLM',
          name: 'LLM',
          createTime: now - 2000,
          input: userMessage,
          output: aiResponse,
        },
      ]);
    }
    
    // 복잡한 질문인 경우: Tool 체인 생성
    // aiResponse는 이미 조회했거나 기본값으로 설정된 실제 응답을 사용
    
    // Step 1: LLM이 사용자 질문을 받고 Tool 호출 결정
    const step1Output = {
      thought: `사용자가 "${userMessage}"라고 질문했습니다. 이 질문에 답하기 위해서는 먼저 어떤 인덱스에 관련 정보가 저장되어 있는지 확인해야 합니다. 'ListIndexTool'을 사용하여 사용 가능한 모든 인덱스 목록을 확인하고, 그 중에서 보안 위협과 관련된 인덱스를 찾아야 합니다.`,
      action: 'ListIndexTool',
      action_input: ''
    };
    
    // Step 2: ListIndexTool 실행
    const step2Output = `row,health,status,index,uuid,pri(number of primary shards),rep(number of replica shards),docs.count(number of available documents),docs.deleted(number of deleted documents),store.size(store size of primary and replica shards),pri.store.size(store size of primary shards)
1,green,open,alerts-sim-2025.10.29,-2hBEcuQQ2ugHeFUTjXQ3g,1,1,3,0,37.2kb,18.6kb
2,green,open,alerts-sim-2025.10.28,KscOvl3oQNqm21Z8a7Fw1Q,1,1,22,0,60.3kb,30.1kb
3,green,open,alerts-sim-2025.10.27,GDLSJE_xRKqO5FP_QqfivQ,1,1,17,0,56kb,28kb
4,green,open,events-sim-2025.10.29,NA2bkAnCRriPc7AY4VL8bQ,1,1,75,0,66.6kb,33.3kb
5,green,open,events-sim-2025.10.28,gG7RVMm5RyqFqQkIQzZrtw,1,1,550,0,300.3kb,167.5kb
6,green,open,events-sim-2025.10.27,ncUhUZICQwG7HIQAYISllg,1,1,425,0,215.4kb,107.7kb
7,green,open,intel-sim-2025.10.27,ZRaal9PcTm6BTw6v0WYAwg,1,1,4,0,18.6kb,9.3kb
8,green,open,kb-sim,P9IXfeI6RlqbHm7Aa-Ugog,1,1,4,0,23.3kb,11.6kb`;
    
    // Step 3: LLM이 인덱스 목록을 보고 다음 단계 결정
    // Step 2의 output을 input으로 사용
    const step3Input = userMessage; // 원래 사용자 질문 유지
    let step3Thought: string;
    let step3ActionInput: string;
    
    if (questionType === 1) {
      step3Thought = `이전 단계에서 사용 가능한 인덱스 목록을 확인했습니다. 사용자가 'WS-023 지난 24h 요약'을 요청했으므로, 'alerts-sim-2025.10.29' 인덱스에서 WS-023 호스트에 대한 최근 24시간 알람을 조회하는 쿼리를 생성해야 합니다.`;
      step3ActionInput = 'alerts-sim-2025.10.29 인덱스에서 WS-023 호스트의 지난 24시간 알람을 찾는 쿼리';
    } else if (questionType === 4) {
      step3Thought = `이전 단계에서 사용 가능한 인덱스 목록을 확인했습니다. 사용자가 'PowerShell 명령어 조사'를 요청했으므로, 'events-sim-2025.10.29' 인덱스에서 PowerShell 관련 이벤트를 검색하고, 'alerts-sim-2025.10.29' 인덱스에서 PowerShell 관련 알람을 조회하는 쿼리를 생성해야 합니다.`;
      step3ActionInput = 'events-sim-2025.10.29, alerts-sim-2025.10.29 인덱스에서 PowerShell 관련 이벤트와 알람을 찾는 쿼리';
    } else {
      step3Thought = `이전 단계에서 사용 가능한 인덱스 목록을 확인했습니다. 'alerts-sim-2025.10.29', 'alerts-sim-2025.10.28', 'alerts-sim-2025.10.27' 와 같은 인덱스들이 보안 알림과 관련이 있어 보입니다. 현재 시간 기준으로 가장 최근의 알림을 찾기 위해 'alerts-sim-2025.10.29' 인덱스에서 최근 데이터를 조회하는 쿼리를 생성해야 합니다.`;
      step3ActionInput = 'alerts-sim-2025.10.29 인덱스에서 최근 발생한 보안 위협을 찾는 쿼리';
    }
    
    const step3Output = {
      thought: step3Thought,
      action: 'QueryPlanningTool',
      action_input: step3ActionInput
    };
    
    // Step 4: QueryPlanningTool이 쿼리 생성
    // Step 3의 action_input을 input으로 받음
    const step4Input = step3Output.action_input;
    
    let step4Query: any;
    let step4Index: string;
    
    if (questionType === 1) {
      step4Index = 'alerts-sim-2025.10.29';
      step4Query = {
        bool: {
          must: [
            { term: { 'entity.host.keyword': 'WS-023' } },
            { range: { '@timestamp': { gte: 'now-24h' } } }
          ]
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: 10
      };
    } else if (questionType === 4) {
      step4Index = 'events-sim-2025.10.29';
      step4Query = {
        bool: {
          must: [
            { term: { 'process.name.keyword': 'powershell.exe' } },
            { range: { '@timestamp': { gte: 'now-24h' } } }
          ]
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: 10
      };
    } else {
      step4Index = 'alerts-sim-2025.10.29';
      step4Query = {
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: 5
      };
    }
    
    const step4Output = {
      thought: `이전 LLM 단계에서 받은 요청을 바탕으로 OpenSearch DSL 쿼리를 생성합니다. ${questionType === 1 ? 'WS-023 호스트에 대한' : questionType === 4 ? 'PowerShell 관련' : '최근 발생한'} 보안 알림을 검색하기 위한 쿼리를 작성했습니다.`,
      action: 'SearchIndexTool',
      action_input: {
        index: step4Index,
        query: step4Query
      }
    };
    
    // Step 5: SearchIndexTool 실행
    // Step 4의 action_input을 JSON으로 받아서 실행
    const step5Input = JSON.stringify(step4Output.action_input, null, 2);
    
    // 질문 타입에 따라 다른 검색 결과 생성
    let step5Output: string;
    
    if (questionType === 4) {
      // PowerShell 조사: events 인덱스 검색 결과
      step5Output = JSON.stringify({
        _shards: { total: 1, failed: 0, successful: 1, skipped: 0 },
        hits: {
          hits: [
            {
              _index: 'events-sim-2025.10.29',
              _source: {
                '@timestamp': '2025-10-29T02:15:23Z',
                event: { category: 'process', action: 'start' },
                host: { name: 'WS-023', ip: '10.0.45.120' },
                user: { name: 'domain\\jdoe' },
                process: {
                  name: 'powershell.exe',
                  pid: 5678,
                  ppid: 1234,
                  command_line: 'powershell.exe -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMAuQBUAEMAUABDAGwAaQBlAG4AdAAuLi4=',
                  parent: { name: 'explorer.exe', pid: 1234 }
                },
                network: {
                  direction: 'outbound',
                  dst_ip: '192.168.1.100',
                  dst_port: 443,
                  protocol: 'tcp'
                },
                file: {
                  path: 'C:\\Users\\User\\AppData\\Temp\\tmp_*.tmp',
                  hash: { sha256: 'abc123def456...' }
                }
              },
              _id: 'evt-20251029-ps-001'
            }
          ],
          total: { value: 1, relation: 'eq' }
        },
        took: 6,
        timed_out: false
      }, null, 2);
    } else {
      // 기타 질문: alerts 인덱스 검색 결과
      step5Output = JSON.stringify({
        _shards: { total: 1, failed: 0, successful: 1, skipped: 0 },
        hits: {
          hits: [
            {
              _index: 'alerts-sim-2025.10.29',
              _source: {
                severity: questionType === 1 ? 'high' : 'high',
                process: {
                  name: 'powershell.exe',
                  pid: 1927,
                  cmd: 'powershell -enc SQBFAFgAIAAtQwBvAG0AbQBhAG4AZA==',
                  ppid: 3995
                },
                '@timestamp': '2025-10-29T02:04:41Z',
                related: {
                  case_id: 'CASE-30214',
                  hash: ['sha256:3e6952e7d990edf4']
                },
                alert_id: 'ALRT-20251029-e2d310f2',
                rule: {
                  name: 'Suspicious PowerShell EncodedCommand',
                  technique: { name: 'PowerShell', id: 'T1059.001' },
                  id: 'R-ps-enc',
                  tactic: 'Execution'
                },
                entity: {
                  ip: '10.0.12.156',
                  host: questionType === 1 ? 'WS-023' : 'SRV-AD-01',
                  user: 'admin'
                },
                network: {
                  domain: 'cdn-upd.example.net',
                  dst_port: 3389,
                  dst_ip: '10.2.5.43'
                }
              },
              _id: 'ALRT-20251029-e2d310f2'
            },
            {
              _index: 'alerts-sim-2025.10.29',
              _source: {
                severity: 'medium',
                process: {
                  name: questionType === 1 ? 'powershell.exe' : 'psexecsvc.exe',
                  pid: 1059,
                  cmd: questionType === 1 ? 'powershell -enc SQBFAFgAIAAtQwBvAG0AbQBhAG4AZA==' : 'psexec \\\\SRV-FILE-02 cmd /c whoami',
                  ppid: 2447
                },
                '@timestamp': '2025-10-29T01:10:37Z',
                related: {
                  case_id: 'CASE-45249',
                  hash: ['sha256:8d0423ae5b94f439']
                },
                alert_id: 'ALRT-20251029-9768c193',
                rule: {
                  name: questionType === 1 ? 'Suspicious PowerShell EncodedCommand' : 'Remote Service Execution (PsExec-like)',
                  technique: { name: questionType === 1 ? 'PowerShell' : 'SMB/Windows Admin Shares', id: questionType === 1 ? 'T1059.001' : 'T1021.002' },
                  id: questionType === 1 ? 'R-ps-enc' : 'R-psexec',
                  tactic: questionType === 1 ? 'Execution' : 'Lateral Movement'
                },
                entity: {
                  ip: '10.0.45.120',
                  host: 'WS-023',
                  user: 'svc_backup'
                },
                network: {
                  domain: 'vpn-gw.example.net',
                  dst_port: 3389,
                  dst_ip: '10.0.12.94'
                }
              },
              _id: 'ALRT-20251029-9768c193'
            }
          ],
          total: { value: questionType === 1 ? 5 : 3, relation: 'eq' }
        },
        took: 8,
        timed_out: false
      }, null, 2);
    }
    
    // Step 6: LLM이 최종 응답 생성
    // Step 5의 output(검색 결과)을 바탕으로 사용자 질문에 대한 최종 응답 생성
    const step6Input = userMessage; // 사용자 질문
    const step6Output = aiResponse; // 실제 AI 응답 (일관성 유지)
    
    return NextResponse.json([
      {
        traceNumber: 1,
        origin: 'LLM',
        name: 'LLM',
        createTime: now - 8000,
        input: userMessage, // 첫 번째 input은 사용자 질문
        output: JSON.stringify(step1Output, null, 2),
      },
      {
        traceNumber: 2,
        origin: 'ListIndexTool',
        name: 'ListIndexTool',
        createTime: now - 7000,
        input: step1Output.action_input, // Step 1의 action_input (빈 문자열)
        output: step2Output,
      },
      {
        traceNumber: 3,
        origin: 'LLM',
        name: 'LLM',
        createTime: now - 6000,
        input: step3Input, // 원래 사용자 질문 유지 (Step 2의 output을 참고했지만 input은 원래 질문)
        output: JSON.stringify(step3Output, null, 2),
      },
      {
        traceNumber: 4,
        origin: 'QueryPlanningTool',
        name: 'QueryPlanningTool',
        createTime: now - 5000,
        input: step4Input, // Step 3의 action_input (쿼리 요청 문자열)
        output: JSON.stringify(step4Output, null, 2),
      },
      {
        traceNumber: 5,
        origin: 'SearchIndexTool',
        name: 'SearchIndexTool',
        createTime: now - 4000,
        input: step5Input, // Step 4의 action_input (JSON으로 변환된 쿼리)
        output: step5Output, // 검색 결과 (JSON)
      },
      {
        traceNumber: 6,
        origin: 'LLM',
        name: 'LLM',
        createTime: now - 2000,
        input: step6Input, // 사용자 질문 (Step 5의 output을 참고하지만 input은 원래 질문)
        output: step6Output, // 실제 AI 응답 (일관성 유지)
      },
    ]);
  }
  
  const username = process.env.OPENSEARCH_USERNAME!;
  const password = process.env.OPENSEARCH_PASSWORD!;
  const dashboardsUrl = process.env.OPENSEARCH_DASHBOARDS_URL || 'http://localhost:5601';
  const basicAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

  // Query parameters 전달
  const searchParams = req.nextUrl.searchParams;
  const queryString = searchParams.toString();

  // SSL 검증 설정
  const rejectUnauthorized = process.env.ENABLE_TLS_VERIFY === 'true';

  const targetUrl = `${dashboardsUrl}/api/assistant/trace/${traceId}${queryString ? `?${queryString}` : ''}`;
  const url = new URL(targetUrl);
  
  const protocol = url.protocol === 'https:' ? https : require('http');
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'Authorization': basicAuth,
      'osd-xsrf': 'true',
    },
    ...(url.protocol === 'https:' && { rejectUnauthorized })
  };

  return new Promise<NextResponse>((resolve, reject) => {
    const httpModule = url.protocol === 'https:' ? https : require('http');
    
    const req = httpModule.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: Buffer) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          // API 오류 체크
          if (!res.statusCode || res.statusCode >= 400) {
            console.error(`Trace API error: ${res.statusCode} - ${data}`);
          } else {
            console.log(`Trace API success: ${res.statusCode}`);
          }
          
          resolve(NextResponse.json(jsonData, {
            status: res.statusCode || 200,
            headers: { 
              'Access-Control-Allow-Origin': '*',
            },
          }));
        } catch (e) {
          console.error('Failed to parse trace response:', e);
          reject(NextResponse.json({ error: 'Failed to parse response', details: String(e) }, { status: 500 }));
        }
      });
    });

    req.on('error', (e: Error) => {
      reject(NextResponse.json({ error: e.message }, { status: 500 }));
    });

    req.end();
  });
}

