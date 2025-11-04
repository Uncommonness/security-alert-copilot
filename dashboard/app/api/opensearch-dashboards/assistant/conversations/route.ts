import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { isDemoMode, logDemoMode } from '@/lib/demoMode';
import { DEMO_CONVERSATIONS } from '@/lib/demoData';

export async function GET(req: NextRequest) {
  // 데모 모드 확인
  if (isDemoMode()) {
    logDemoMode('assistant/conversations');
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const perPage = Math.max(1, Math.min(Number(searchParams.get('perPage') || 20), 100));
    
    const total = DEMO_CONVERSATIONS.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, total);
    const paginated = DEMO_CONVERSATIONS.slice(startIndex, endIndex);
    
    return NextResponse.json({
      objects: paginated,
      total,
      page,
      perPage,
      totalPages,
    });
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

  const targetUrl = `${dashboardsUrl}/api/assistant/conversations${queryString ? `?${queryString}` : ''}`;
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
          resolve(NextResponse.json(jsonData, {
            status: res.statusCode || 200,
            headers: { 
              'Access-Control-Allow-Origin': '*',
            },
          }));
        } catch (e) {
          reject(NextResponse.json({ error: 'Failed to parse response' }, { status: 500 }));
        }
      });
    });

    req.on('error', (e: Error) => {
      reject(NextResponse.json({ error: e.message }, { status: 500 }));
    });

    req.end();
  });
}

