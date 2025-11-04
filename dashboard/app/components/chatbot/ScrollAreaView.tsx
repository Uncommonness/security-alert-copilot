'use client';

import React from 'react';
import { format } from 'date-fns';
import type { useTranslations } from 'next-intl';

import MarkdownRenderer from '@/app/components/common/MarkdownRenderer';
import ActionApprovalButton from '@/app/components/actions/ActionApprovalButton';
import { parseActionProposal } from '@/lib/actionParser';
import { IconCopy, IconInfo } from '@/app/components/icons/Icons';
import type { ChatbotMessage, ProposedAction } from '@/types/chatbot';
import type { ActionResult } from '@/types/actions';

type ScrollAreaViewProps = {
  messages: ChatbotMessage[];
  isInitialized: boolean;
  loading: boolean;
  copiedMessageId: string | null;
  copyBusyId: string | null;
  bottomRef: React.RefObject<HTMLDivElement>;
  sanitizeMessageContent: (msg: ChatbotMessage) => ChatbotMessage;
  onTrace: (interactionId: string) => void;
  onCopy: (msg: ChatbotMessage) => Promise<void> | void;
  t: ReturnType<typeof useTranslations>;
  onActionApproved?: (messageId: string, action: ProposedAction, result: ActionResult) => Promise<void> | void;
};

export function ChatbotScrollAreaView({
  messages,
  isInitialized,
  loading,
  copiedMessageId,
  copyBusyId,
  bottomRef,
  sanitizeMessageContent,
  onTrace,
  onCopy,
  t,
  onActionApproved,
}: ScrollAreaViewProps) {
  return (
    <div className="flex-1 min-h-[200px] overflow-y-auto space-y-2 px-1">
      {messages.length === 0 && isInitialized && (
        <div className="text-gray-400 text-center">{t('empty')}</div>
      )}
      {messages.map((msg) => {
        const isUser = msg.type === 'input';
        const time = msg.createdAt
          ? format(new Date(msg.createdAt), 'HH:mm')
          : '시간 없음';
        const sanitizedMsg = sanitizeMessageContent(msg);
        
        // Agent 응답에서 액션 제안 파싱 (이미 파싱된 것이 없으면)
        const proposedAction = sanitizedMsg.proposedAction || 
          (!isUser ? parseActionProposal(sanitizedMsg.content || '') : null);

        // actionResult는 sanitize를 거쳐도 보존되어야 하므로 원본 메시지에서 직접 가져옴
        const actionResult = msg.actionResult || sanitizedMsg.actionResult;
        
        return (
          <div
            key={msg.messageId}
            className={`euiPanel euiPanel--paddingLarge euiPanel--borderRadiusMedium euiPanel--plain euiPanel--noShadow euiPanel--noBorder llm-chat-bubble-panel llm-chat-bubble-panel-$
              {isUser ? 'input' : 'output'} mb-2`}
            aria-label="chat message bubble"
          >
            <div className="markdown_with_blink_cursor">
              <div className="euiMarkdownFormat">
                <div>
                  {sanitizedMsg.contentType === 'markdown' ? (
                    <div className="prose">
                      <MarkdownRenderer>
                        {String(sanitizedMsg.content || '')}
                      </MarkdownRenderer>
                    </div>
                  ) : (
                    <p>{sanitizedMsg.content}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 액션 제안 UI */}
            {!isUser && proposedAction && !actionResult && (
              <div className="mt-3">
                <ActionApprovalButton
                  action={{
                    id: proposedAction.action,
                    description: proposedAction.description || proposedAction.action,
                    command: proposedAction.command,
                    params: proposedAction.params || {}
                  }}
                  onApproved={async (result) => {
                    console.log('ActionApprovalButton onApproved 호출:', result);
                    if (onActionApproved) {
                      await onActionApproved(msg.messageId, proposedAction, result);
                    } else {
                      console.warn('onActionApproved가 정의되지 않음');
                    }
                  }}
                />
              </div>
            )}

            {/* 액션 실행 결과 표시 */}
            {!isUser && actionResult && (
              <div className={`mt-3 p-3 rounded-lg border ${
                actionResult.success 
                  ? 'bg-green-950/20 border-green-500/30' 
                  : 'bg-red-950/20 border-red-500/30'
              }`}>
                <div className="text-xs text-white font-semibold mb-1">
                  {actionResult.success ? '✓ 실행 완료' : '✗ 실행 실패'}
                </div>
                {actionResult.command && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-400 mb-1">실행된 명령어:</div>
                    <pre className="text-xs text-gray-300 bg-gray-900/50 p-2 rounded whitespace-pre-wrap">
                      {actionResult.command}
                    </pre>
                  </div>
                )}
                {actionResult.output && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-400 mb-1">출력:</div>
                    <pre className="text-xs text-gray-300 bg-gray-900/50 p-2 rounded whitespace-pre-wrap">
                      {actionResult.output}
                    </pre>
                  </div>
                )}
                {actionResult.error && (
                  <div>
                    <div className="text-xs text-red-400 mb-1">오류:</div>
                    <pre className="text-xs text-red-300 bg-red-900/50 p-2 rounded whitespace-pre-wrap">
                      {actionResult.error}
                    </pre>
                  </div>
                )}
                {actionResult.auditId && (
                  <div className="text-xs text-gray-400 mt-2">
                    감사 ID: {actionResult.auditId}
                  </div>
                )}
                {actionResult.simulation && (
                  <div className="text-xs text-yellow-400 mt-2">
                    ⚠️ 시뮬레이션 모드로 실행되었습니다.
                  </div>
                )}
              </div>
            )}
            <div className="euiSpacer euiSpacer--xs"></div>
            <div
              className="euiFlexGroup euiFlexGroup--gutterExtraSmall euiFlexGroup--alignItemsCenter euiFlexGroup--justifyContentFlexEnd euiFlexGroup--directionRow"
              aria-label="message actions"
            >
              {!isUser && msg.interactionId && (
              <div className="euiFlexItem euiFlexItem--flexGrowZero">
                <span className="euiToolTipAnchor">
                  <button
                    className="euiButtonIcon euiButtonIcon--text euiButtonIcon--empty euiButtonIcon--small"
                    type="button"
                    aria-label="How was this generated?"
                    data-test-subj={`trace-icon-${msg.interactionId ?? ''}`}
                    onClick={() => onTrace(msg.interactionId ?? '')}
                    disabled={loading}
                      style={{
                        color: isUser ? 'rgba(41, 242, 128, 0.9)' : 'rgba(88, 46, 242, 0.9)',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.color = isUser ? 'rgba(41, 242, 128, 1)' : 'rgba(88, 46, 242, 1)';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.color = isUser ? 'rgba(41, 242, 128, 0.9)' : 'rgba(88, 46, 242, 0.9)';
                      }}
                  >
                    <IconInfo className="euiIcon euiIcon--medium euiIcon--inherit euiIcon-isLoaded euiButtonIcon__icon" />
                  </button>
                </span>
              </div>
              )}
              <div className="euiFlexItem euiFlexItem--flexGrowZero">
                <span className="euiToolTipAnchor">
                  <button
                    className="euiButtonIcon euiButtonIcon--text euiButtonIcon--empty euiButtonIcon--small"
                    type="button"
                    aria-label="Copy message"
                    onClick={() => onCopy(msg)}
                    disabled={loading || copyBusyId === msg.messageId}
                    data-test-subj={`copy-icon-${msg.messageId}`}
                    style={{
                      color: isUser ? 'rgba(41, 242, 128, 0.9)' : 'rgba(88, 46, 242, 0.9)',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.color = isUser ? 'rgba(41, 242, 128, 1)' : 'rgba(88, 46, 242, 1)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.color = isUser ? 'rgba(41, 242, 128, 0.9)' : 'rgba(88, 46, 242, 0.9)';
                    }}
                  >
                    <IconCopy width={16} height={16} className="euiIcon euiButtonIcon__icon" />
                  </button>
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-400 mt-1 mr-1">{time}</span>
              {copiedMessageId === msg.messageId && (
                <span className="text-xs text-green-600 mt-1 mr-2">Copied!</span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
      {loading && (
        <div className="flex justify-start mb-2">
          <div className="px-4 py-2 rounded-2xl shadow" style={{ background: 'rgba(88, 46, 242, 0.15)' }}>
            <span className="ai-typing" aria-live="polite" aria-label="생성 중">
              <i></i>
              <i></i>
              <i></i>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
