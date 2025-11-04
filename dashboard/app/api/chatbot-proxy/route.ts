import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';
import { isDemoMode, logDemoMode } from '@/lib/demoMode';
import { generateDemoResponse, storeInteractionMessage } from '@/lib/demoData';

export async function POST(req: NextRequest) {
  // 데모 모드 확인
  if (isDemoMode()) {
    logDemoMode('chatbot-proxy');
    const body = await req.json();
    const userMessage = body.input?.content || body.messages?.slice(-1)[0]?.content || '';
    
    // 약간의 지연 시뮬레이션 (사용자 경험 향상)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const demoResponse = generateDemoResponse(userMessage, body.conversationId);
    
    // interactionId와 사용자 메시지/응답 저장 (trace API에서 사용)
    const outputMessage = demoResponse.messages.find(m => m.type === 'output');
    if (outputMessage?.interactionId && outputMessage.content) {
      storeInteractionMessage(outputMessage.interactionId, userMessage, outputMessage.content);
    }
    
    return NextResponse.json(demoResponse);
  }
  
  const body = await req.json();
  const username = process.env.OPENSEARCH_USERNAME!;
  const password = process.env.OPENSEARCH_PASSWORD!;
  const dashboardsUrl = process.env.OPENSEARCH_DASHBOARDS_URL || 'http://localhost:5601';
  const basicAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

  // SSL 검증 설정 (인증 환경변수로 제어)
  const rejectUnauthorized = process.env.ENABLE_TLS_VERIFY === 'true';

  // Node.js fetch 대신 http/https 모듈 사용
  const url = new URL(`${dashboardsUrl}/api/assistant/send_message`);
  const postData = JSON.stringify(body);
  
  const options: https.RequestOptions & http.RequestOptions = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': basicAuth,
      'osd-xsrf': 'true',
      'Content-Length': Buffer.byteLength(postData)
    },
    ...(url.protocol === 'https:' ? { rejectUnauthorized } : {})
  };

  return new Promise<NextResponse>((resolve, reject) => {
    const httpModule = url.protocol === 'https:' ? https : http;
    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        // 원본 상태 코드를 유지하되, 본문 파싱을 최대한 시도
        const status = res.statusCode || 200;
        let responseBody: unknown = data;
        try {
          responseBody = JSON.parse(data) as unknown;
        } catch {
          // 텍스트 그대로 전달
          responseBody = { raw: String(data || ''), parseError: true };
        }
        resolve(NextResponse.json(responseBody, { status }));
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}
