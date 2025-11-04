import { NextRequest } from 'next/server';
import https from 'https';
import { isDemoMode, logDemoMode } from '@/lib/demoMode';
import { DEMO_INDICES } from '@/lib/demoData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function uniq<T>(arr: T[]) { return [...new Set(arr)]; }

export async function GET(req: NextRequest) {
  // 데모 모드 확인
  if (isDemoMode()) {
    logDemoMode('opensearch/indices');
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const size = Math.max(1, Math.min(Number(searchParams.get('size') || 20), 100));
    
    // 검색어에 따라 필터링
    let filtered = DEMO_INDICES;
    if (q && q !== '*') {
      const searchLower = q.toLowerCase().replace(/\*/g, '');
      filtered = DEMO_INDICES.filter(idx => 
        idx.toLowerCase().includes(searchLower)
      );
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / size);
    const startIndex = (page - 1) * size;
    const endIndex = Math.min(startIndex + size, total);
    const paginatedIndices = filtered.slice(startIndex, endIndex);
    
    return Response.json({
      indices: paginatedIndices,
      total,
      page,
      totalPages,
      size,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  }
  
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const size = Math.max(1, Math.min(Number(searchParams.get('size') || 20), 100));
  const limit = Math.max(1, Math.min(Number(searchParams.get('limit') || 50), 500));
  if (!q) return Response.json({ indices: [], total: 0, page: 1, totalPages: 1 });

  const base = process.env.OPENSEARCH_URL;
  const user = process.env.OPENSEARCH_USERNAME;
  const pass = process.env.OPENSEARCH_PASSWORD;
  if (!base) {
    return Response.json({ error: 'Missing OPENSEARCH_URL' }, { status: 500 });
  }

  const headers: Record<string, string> = {};
  if (user && pass) {
    headers.Authorization = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  }

  // SSL 검증 설정 (인증 환경변수로 제어)
  const rejectUnauthorized = process.env.ENABLE_TLS_VERIFY === 'true';

  // 입력 포함 매칭: *q*
  const pattern = `*${q}*`;

  // 1) List Indices API 시도 (경로 패턴 사용)
  async function listViaListApi(): Promise<string[]> {
    const url = `${base}/_list/indices/${encodeURIComponent(pattern)}?size=${limit}&sort=asc&expand_wildcards=all&format=json`;
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { ...headers, Accept: 'application/json' },
        rejectUnauthorized
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`LIST ${res.statusCode}: ${data}`));
              return;
            }

            // 어떤 배포는 text/plain으로만 줄 수 있어 → 텍스트 파싱
            if (!data.trim().startsWith('{')) {
              const indices = data
                .split('\n')
                .map(l => l.trim())
                .filter(Boolean)
                .filter(l => !l.startsWith('next_token'))
                .map(l => l.split(/\s+/)[2]) // "green open <index> ..." → 3번째 토큰
                .filter(Boolean);
              resolve(indices);
              return;
            }

            // JSON 응답
            const j = JSON.parse(data);
            const arr = Array.isArray(j.indices) ? j.indices : [];
            const indices = arr.map((x: any) => x.index).filter(Boolean);
            resolve(indices);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }

  // 2) 폴백: CAT Indices(JSON) — 모든 버전에서 동작
  async function listViaCat(): Promise<string[]> {
    const url = `${base}/_cat/indices/${encodeURIComponent(pattern)}?format=json&h=index&s=index`;
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers,
        rejectUnauthorized
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`CAT ${res.statusCode}: ${data}`));
              return;
            }

            const j = JSON.parse(data);
            const indices = (Array.isArray(j) ? j : []).map((x: any) => x.index).filter(Boolean);
            resolve(indices);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }

  let names: string[] = [];
  try {
    names = await listViaListApi();
    // List가 빈 배열이면 CAT로 한 번 더 시도 (권한/버전/포맷 이슈 대비)
    if (names.length === 0) {
      try { names = await listViaCat(); } catch { /* ignore */ }
    }
  } catch {
    try { names = await listViaCat(); } catch { names = []; }
  }

  const uniqueNames = uniq(names);
  const total = uniqueNames.length;
  const totalPages = Math.ceil(total / size);
  const startIndex = (page - 1) * size;
  const endIndex = Math.min(startIndex + size, total);
  const paginatedIndices = uniqueNames.slice(startIndex, endIndex);

  return Response.json({ 
    indices: paginatedIndices,
    total,
    page,
    totalPages,
    size,
    hasNext: page < totalPages,
    hasPrev: page > 1
  });
}
