'use client';

import React, { useState } from 'react';
import Button from '@/app/components/ui/Button';
import type { ActionResult } from '@/types/actions';

interface ActionApprovalButtonProps {
  action: {
    id: string;
    description: string;
    command?: string;
    params: Record<string, unknown>;
  };
  onApproved: (result: ActionResult) => void;
  onRejected?: () => void;
}

export default function ActionApprovalButton({
  action,
  onApproved,
  onRejected
}: ActionApprovalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      console.log('액션 실행 시작:', action.id, action.params);
      
      const response = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action.id,
          params: action.params,
          approved: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 오류:', response.status, errorText);
        onApproved({ 
          success: false,
          action: action.id,
          error: `서버 오류: ${response.status}`,
          output: errorText 
        });
        return;
      }

      const result = await response.json() as ActionResult;
      console.log('액션 실행 결과:', result);
      onApproved(result);
    } catch (error) {
      console.error('액션 실행 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      onApproved({ 
        success: false, 
        action: action.id,
        error: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    if (onRejected) {
      onRejected();
    }
  };

  return (
    <div className="my-4 p-4 border border-blue-500/30 rounded-lg bg-blue-950/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-blue-300 mb-1">
            {action.description}
          </h4>
          <p className="text-sm text-gray-400">
            이 액션을 실행하시겠습니까?
          </p>
        </div>
      </div>

      {action.command && (
        <div className="mb-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showDetails ? '▼' : '▶'} 명령어 보기
          </button>
          {showDetails && (
            <pre className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
              {action.command}
            </pre>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? '실행 중...' : '✓ 승인 및 실행'}
        </Button>
        <Button
          onClick={handleReject}
          disabled={loading}
          variant="transparent"
          className="border border-red-500 text-red-400 hover:bg-red-950/20"
        >
          ✗ 거부
        </Button>
      </div>
    </div>
  );
}

