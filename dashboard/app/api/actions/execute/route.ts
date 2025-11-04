import { NextRequest, NextResponse } from 'next/server';
import { promisify } from 'util';
import { exec } from 'child_process';
import type { ActionParams, ActionConfig } from '@/types/actions';

const execAsync = promisify(exec);

/**
 * 허용된 액션 화이트리스트
 * 
 * 보안상의 이유로 화이트리스트 방식으로 액션을 관리합니다.
 * 
 * @property allowLocalExecution - true: 안전한 읽기 전용 명령어, 실제 PC에서 실행 가능
 *                                - false: 위험한 명령어, 시뮬레이션만 지원
 * 
 * @remarks
 * - 위험한 명령어(격리, 종료, 차단 등)는 항상 시뮬레이션 모드로만 실행됩니다.
 * - 안전한 읽기 전용 명령어는 `ENABLE_ACTION_EXECUTION=true` 환경변수가 설정되어야 실제 실행됩니다.
 */
const ALLOWED_ACTIONS: Record<string, ActionConfig> = {
  // ⚠️ 위험한 명령어들: 시뮬레이션만 지원
  'host-isolate': {
    command: (params: ActionParams) => {
      const hostname = 'hostname' in params ? params.hostname || '' : '';
      return `Write-Host "[격리] 호스트: ${hostname}" -ForegroundColor Yellow; Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion`;
    },
    description: '호스트 정보 조회 (격리 시뮬레이션)',
    requiresApproval: true,
    allowLocalExecution: false // 위험: 실제 격리는 Security API를 통해 처리
  },
  'process-kill': {
    command: (params: ActionParams) => {
      const pid = ('pid' in params ? params.pid : undefined) || ('pid_str' in params ? params.pid_str : undefined) || '';
      if (!pid) return `Write-Host "PID가 제공되지 않았습니다." -ForegroundColor Red`;
      return `$proc = Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if ($proc) { Write-Host "[종료 시도] 프로세스: $($proc.Name) (PID: ${pid})" -ForegroundColor Yellow } else { Write-Host "[오류] PID ${pid}를 찾을 수 없습니다." -ForegroundColor Red }`;
    },
    description: '프로세스 정보 조회 (종료 시뮬레이션)',
    requiresApproval: true,
    allowLocalExecution: false // 위험: 실제 프로세스 종료는 Security API를 통해 처리
  },
  'network-block': {
    command: (params: ActionParams) => {
      const ip = 'ip' in params ? params.ip || '' : '';
      const port = 'port' in params ? params.port : undefined;
      if (!ip) return `Write-Host "IP 주소가 제공되지 않았습니다." -ForegroundColor Red`;
      return `Write-Host "[차단 시뮬레이션] IP: ${ip}${port ? `, 포트: ${port}` : ''}" -ForegroundColor Yellow; Test-NetConnection -ComputerName ${ip}${port ? ` -Port ${port}` : ''} -InformationLevel Quiet`;
    },
    description: '네트워크 연결 테스트 (차단 시뮬레이션)',
    requiresApproval: true,
    allowLocalExecution: false // 위험: 실제 네트워크 차단은 Security API를 통해 처리
  },
  'hash-block': {
    command: (params: ActionParams) => {
      const hash = 'hash' in params ? params.hash || '' : '';
      if (!hash) return `Write-Host "해시가 제공되지 않았습니다." -ForegroundColor Red`;
      // 해시 차단 시뮬레이션: 해시 정보를 표시하고 차단 명령을 시뮬레이션
      // 실제로는 Security API에 해시를 등록하는 것이지만, 여기서는 정보만 표시
      return `Write-Host "[차단 시뮬레이션] 해시: ${hash}" -ForegroundColor Yellow; Write-Host "해시 차단 조치가 실행되었습니다." -ForegroundColor Green; Write-Host "SHA256 해시: ${hash}" -ForegroundColor Cyan`;
    },
    description: '해시 차단 (시뮬레이션)',
    requiresApproval: true,
    allowLocalExecution: false // 위험: 실제 해시 차단은 Security API를 통해 처리
  },
  // ✅ 안전한 읽기 전용 명령어들: 실제 PC에서 실행 가능
  'list-processes': {
    command: (params: ActionParams) => {
      const name = 'name' in params ? params.name || '' : '';
      if (name) {
        return `Get-Process -Name "${name}" | Select-Object Id, Name, CPU, WorkingSet | Format-Table`;
      }
      return `Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Id, Name, CPU, WorkingSet | Format-Table`;
    },
    description: '프로세스 목록 조회',
    requiresApproval: true,
    allowLocalExecution: true // 안전: 읽기 전용 조회
  },
  'system-info': {
    command: () => `Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory, CsProcessors | Format-List`,
    description: '시스템 정보 조회',
    requiresApproval: true,
    allowLocalExecution: true // 안전: 읽기 전용 조회
  },
  'network-connections': {
    command: () => `Get-NetTCPConnection | Where-Object {$_.State -eq 'Established'} | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State | Format-Table`,
    description: '네트워크 연결 상태 조회',
    requiresApproval: true,
    allowLocalExecution: true // 안전: 읽기 전용 조회
  }
};

/**
 * POST /api/actions/execute
 * 
 * 사용자가 승인한 액션을 실행하는 API 엔드포인트입니다.
 * 
 * Human-in-the-Loop 방식으로 동작하며, 사용자 승인 없이는 실행되지 않습니다.
 * 위험한 액션은 항상 시뮬레이션 모드로만 실행되고, 안전한 읽기 전용 명령어만 실제 실행됩니다.
 * 
 * @param req - Next.js 요청 객체
 * @param req.body.action - 실행할 액션 ID (ALLOWED_ACTIONS에 정의된 것만 허용)
 * @param req.body.params - 액션 실행에 필요한 파라미터
 * @param req.body.approved - 사용자 승인 여부 (true여야 실행됨)
 * 
 * @returns 액션 실행 결과 (ActionResult)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/actions/execute', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     action: 'list-processes',
 *     params: {},
 *     approved: true
 *   })
 * });
 * ```
 * 
 * @throws {400} 액션이 승인되지 않음
 * @throws {403} 허용되지 않은 액션
 * @throws {500} 액션 실행 실패
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, params, approved } = body;

    // 승인 확인
    if (!approved) {
      return NextResponse.json(
        { error: '액션이 승인되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 허용된 액션인지 확인
    if (!ALLOWED_ACTIONS[action as keyof typeof ALLOWED_ACTIONS]) {
      return NextResponse.json(
        { error: `허용되지 않은 액션: ${action}` },
        { status: 403 }
      );
    }

    const actionConfig = ALLOWED_ACTIONS[action as keyof typeof ALLOWED_ACTIONS];
    
    // 명령어 생성
    let psCommand: string;
    if (typeof actionConfig.command === 'function') {
      const parsedParams = typeof params === 'string' 
        ? (JSON.parse(params) as ActionParams)
        : (params as ActionParams);
      psCommand = actionConfig.command(parsedParams);
    } else {
      psCommand = typeof params === 'string' 
        ? actionConfig.command.replace('{params}', params)
        : actionConfig.command;
    }
    
    // 환경변수로 실제 실행 여부 제어
    const enableExecution = process.env.ENABLE_ACTION_EXECUTION === 'true';
    
    // allowLocalExecution이 false인 경우: 항상 시뮬레이션만 지원 (위험한 명령어)
    if (!actionConfig.allowLocalExecution) {
      const simulatedOutput = `[시뮬레이션] ${actionConfig.description} 실행 완료
명령어: ${psCommand}
⚠️ 이 액션은 보안상 위험하므로 실제 PC에서 실행되지 않습니다.
실제 환경에서는 Security API를 통해 실행됩니다.`;

      return NextResponse.json({
        success: true,
        action,
        message: `액션 "${actionConfig.description}" (시뮬레이션 모드)`,
        command: psCommand,
        output: simulatedOutput,
        params,
        timestamp: new Date().toISOString(),
        auditId: `AUDIT-${Date.now()}`,
        simulation: true,
        note: '실제 실행은 Security API를 통해 처리됩니다. 로컬 PC에서 명령어 실행은 보안상 비활성화되어 있습니다.'
      });
    }
    
    // allowLocalExecution이 true이지만 환경변수가 false인 경우: 시뮬레이션
    if (!enableExecution) {
      const simulatedOutput = `[시뮬레이션] ${actionConfig.description} 실행 완료
명령어: ${psCommand}
⚠️ 실제 실행을 위해서는 .env 파일에 ENABLE_ACTION_EXECUTION=true를 설정해야 합니다.`;

      return NextResponse.json({
        success: true,
        action,
        message: `액션 "${actionConfig.description}" (시뮬레이션 모드)`,
        command: psCommand,
        output: simulatedOutput,
        params,
        timestamp: new Date().toISOString(),
        auditId: `AUDIT-${Date.now()}`,
        simulation: true,
        note: '실제 실행하려면 .env에 ENABLE_ACTION_EXECUTION=true 설정이 필요합니다.'
      });
    }
    
    // allowLocalExecution이 true이고 환경변수도 true인 경우: 안전한 읽기 전용 명령어 실제 실행
    try {
      // 명령어 실행 (내부 구현: Windows 환경)
      // -NoProfile: 프로필 로드 안 함 (빠른 실행)
      // -ExecutionPolicy Bypass: 실행 정책 우회
      const { stdout, stderr } = await execAsync(
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psCommand.replace(/"/g, '\\"').replace(/\$/g, '`$')}"`,
        { 
          maxBuffer: 1024 * 1024 * 10, // 10MB
          timeout: 30000 // 30초 타임아웃
        }
      );
      
      return NextResponse.json({
        success: true,
        action,
        command: psCommand,
        output: stdout || '',
        error: stderr || undefined,
        timestamp: new Date().toISOString(),
        auditId: `AUDIT-${Date.now()}`,
        executed: true,
        simulation: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const execError = error as { stdout?: string; stderr?: string };
      return NextResponse.json({
        success: false,
        action,
        command: psCommand,
        error: errorMessage,
        stdout: execError.stdout || '',
        stderr: execError.stderr || '',
        timestamp: new Date().toISOString(),
        executed: true,
        simulation: false
      }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/actions/execute
 * 
 * 시스템에서 실행 가능한 액션 목록을 조회하는 API 엔드포인트입니다.
 * 
 * @returns 사용 가능한 액션 목록과 각 액션의 설명 및 승인 필요 여부
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/actions/execute');
 * const { actions } = await response.json();
 * // [{ id: 'list-processes', description: '프로세스 목록 조회', requiresApproval: true }, ...]
 * ```
 */
export async function GET() {
  return NextResponse.json({
    actions: Object.entries(ALLOWED_ACTIONS).map(([key, config]) => ({
      id: key,
      description: config.description,
      requiresApproval: config.requiresApproval
    }))
  });
}

