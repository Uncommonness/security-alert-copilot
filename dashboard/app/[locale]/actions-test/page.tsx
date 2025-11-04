'use client';

import React, { useState } from 'react';
import ActionApprovalButton from '@/app/components/actions/ActionApprovalButton';
import type { ActionResult } from '@/types/actions';

export default function ActionsTestPage() {
  const [results, setResults] = useState<ActionResult[]>([]);

  const handleApproved = (result: ActionResult) => {
    setResults(prev => [result, ...prev]);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">보안 조치 실행 테스트</h1>
      
      <div className="space-y-4 mb-8">
        <ActionApprovalButton
          action={{
            id: 'host-isolate',
            description: '호스트 격리',
            command: 'Isolate-Host -Hostname WS-023',
            params: { hostname: 'WS-023' }
          }}
          onApproved={handleApproved}
        />

        <ActionApprovalButton
          action={{
            id: 'process-kill',
            description: '프로세스 종료',
            command: 'Stop-Process -Id 1234 -Force',
            params: { pid: '1234', hostname: 'WS-023' }
          }}
          onApproved={handleApproved}
        />

        <ActionApprovalButton
          action={{
            id: 'network-block',
            description: '네트워크 차단',
            command: 'Add-FirewallRule -IP 192.168.1.100 -Port 443',
            params: { ip: '192.168.1.100', port: 443 }
          }}
          onApproved={handleApproved}
        />

        <ActionApprovalButton
          action={{
            id: 'hash-block',
            description: '해시 차단',
            command: 'Add-HashBlock -Hash sha256:abc123...',
            params: { hash: 'sha256:abc123def456' }
          }}
          onApproved={handleApproved}
        />

        <ActionApprovalButton
          action={{
            id: 'list-processes',
            description: '프로세스 목록 조회',
            command: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 10',
            params: {}
          }}
          onApproved={handleApproved}
        />

        <ActionApprovalButton
          action={{
            id: 'system-info',
            description: '시스템 정보 조회',
            command: 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion',
            params: {}
          }}
          onApproved={handleApproved}
        />

        <ActionApprovalButton
          action={{
            id: 'network-connections',
            description: '네트워크 연결 상태 조회',
            command: 'Get-NetTCPConnection | Where-Object {$_.State -eq "Established"}',
            params: {}
          }}
          onApproved={handleApproved}
        />
      </div>

      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">실행 결과</h2>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-950/20 border-green-500/30'
                    : 'bg-red-950/20 border-red-500/30'
                }`}
              >
                <pre className="text-xs overflow-x-auto text-gray-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-950/20 border border-blue-500/30 rounded-lg">
        <h3 className="font-semibold mb-2">ℹ️ 시뮬레이션 모드</h3>
        <p className="text-sm text-gray-400 mb-2">
          모든 액션은 <strong>시뮬레이션 모드</strong>로 실행됩니다.
        </p>
        <div className="p-3 bg-green-950/20 border border-green-500/30 rounded mt-3">
          <p className="text-xs text-green-300 font-semibold mb-1">✓ 보안 보호 활성화</p>
          <ul className="text-xs text-green-200/80 space-y-1 list-disc list-inside">
            <li>로컬 PC에서 명령어가 실행되지 않습니다</li>
            <li>모든 액션은 시뮬레이션 결과만 반환합니다</li>
            <li>실제 환경에서는 Security API를 통해 실행됩니다</li>
            <li>모든 명령어는 화이트리스트 방식으로만 허용됩니다</li>
          </ul>
        </div>
        <div className="p-3 bg-yellow-950/20 border border-yellow-500/30 rounded mt-3">
          <p className="text-xs text-yellow-300 font-semibold mb-1">📋 실제 환경 구현 방법</p>
          <p className="text-xs text-yellow-200/80 mt-1">
            프로덕션 환경에서는 <code className="bg-gray-800 px-1 rounded">dashboard/app/api/actions/execute/route.ts</code>의
            시뮬레이션 부분을 Security API 호출로 교체해야 합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

