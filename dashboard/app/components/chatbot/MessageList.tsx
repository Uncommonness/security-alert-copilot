"use client";

import React from "react";
import type { useTranslations } from "next-intl";

import LoaderDots from "@/app/components/common/LoaderDots";
import MarkdownRenderer from "@/app/components/common/MarkdownRenderer";
import ActionApprovalButton from "@/app/components/actions/ActionApprovalButton";
import { parseActionProposal } from "@/lib/actionParser";
import {
  IconChevron,
  IconCopy,
  IconHistory,
  IconInfo,
} from "@/app/components/icons/Icons";
import type { ChatbotMessage, ProposedAction } from "@/types/chatbot";
import type { ActionResult } from "@/types/actions";

type MessageListProps = {
  t: ReturnType<typeof useTranslations>;
  messages: ChatbotMessage[];
  isInitialized: boolean;
  showWelcomeAnimation: boolean;
  panelWidth: number;
  bubbleMaxPercent: number;
  inputContainerHeight: number;
  sanitizeMessageContent: (message: ChatbotMessage) => ChatbotMessage;
  hasUrlContext: (content: string) => boolean;
  extractUserMessage: (content: string) => string;
  traceMap: Record<string, unknown>;
  traceOpenMap: Record<string, boolean>;
  openStepMap: Record<string, number[]>;
  onToggleTrace: (interactionId: string) => Promise<void> | void;
  onToggleTraceStep: (interactionId: string, stepIndex: number) => void;
  traceLoadingId: string | null;
  onCopyMessage: (message: ChatbotMessage) => Promise<void> | void;
  copyBusyId: string | null;
  copiedMessageId: string | null;
  loading: boolean;
  bottomRef: React.RefObject<HTMLDivElement>;
  onActionApproved?: (messageId: string, action: ProposedAction, result: ActionResult) => void;
};

export function MessageList({
  t,
  messages,
  isInitialized,
  showWelcomeAnimation,
  panelWidth,
  bubbleMaxPercent,
  inputContainerHeight,
  sanitizeMessageContent,
  hasUrlContext,
  extractUserMessage,
  traceMap,
  traceOpenMap,
  openStepMap,
  onToggleTrace,
  onToggleTraceStep,
  traceLoadingId,
  onCopyMessage,
  copyBusyId,
  copiedMessageId,
  loading,
  bottomRef,
  onActionApproved,
}: MessageListProps) {
  return (
    <div
      data-scroll-area
      className="absolute top-0 left-0 right-0 overflow-y-auto px-2 md:px-4 pt-4 md:pt-6 pr-2 md:pr-6 space-y-2"
      style={{
        bottom: `${inputContainerHeight}px`,
        paddingBottom: "24px",
        background: "#141926",
      }}
    >
      {isInitialized && (
        <div className="flex justify-center mb-6">
          <div
            className={`rounded-xl p-8 w-full ${showWelcomeAnimation ? "welcome-animate" : ""}`}
            style={{
              maxWidth: `${panelWidth}px`,
              width: "100%",
              background: "rgba(88, 46, 242, 0.08)",
              border: "none",
            }}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#592EF2] to-[#29F280] rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">💬</span>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">{t("welcomeTitle")}</h3>
                <p className="text-[#BFCAD9] text-sm leading-relaxed">{t("welcomeDescription1")}</p>
                <p className="text-[#BFCAD9] text-sm leading-relaxed">{t("welcomeDescription2")}</p>
                <p className="text-[#BFCAD9] text-sm">{t("welcomeQuestion")}</p>
              </div>
              <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(88, 46, 242, 0.15)" }}>
                <p className="text-xs text-[#BFCAD9]/60 leading-relaxed">
                  {t("welcomeDisclaimer")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {messages.map((message) => {
        const isUser = message.type === "input";
        const sanitized = sanitizeMessageContent(message);
        const timeLabel = sanitized.createdAt
          ? new Date(sanitized.createdAt).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : t("timeMissing", { default: "시간 없음" });

        const hasUrl = isUser && hasUrlContext(sanitized.content || "");
        const displayContent = hasUrl
          ? extractUserMessage(sanitized.content || "")
          : sanitized.content;

        const interactionId = sanitized.interactionId ?? "";
        
        // Debug: interactionId 로깅
        if (!isUser && !interactionId) {
          console.warn("No interactionId for AI message:", message);
        }
        
        const traceData = interactionId ? traceMap[interactionId] : null;
        const traceOpen = interactionId ? Boolean(traceOpenMap[interactionId]) : false;
        const openSteps = interactionId ? openStepMap[interactionId] ?? [] : [];
        // 타입 가드: traceData가 유효한지 확인
        const hasTraceData = traceData != null && (Array.isArray(traceData) || typeof traceData === 'object');

        // Agent 응답에서 액션 제안 파싱 (이미 파싱된 것이 없으면)
        const proposedAction = sanitized.proposedAction || 
          (!isUser ? parseActionProposal(sanitized.content || '') : null);

        // actionResult는 sanitize를 거쳐도 보존되어야 하므로 원본 메시지에서 직접 가져옴
        const actionResult = message.actionResult || sanitized.actionResult;
        
        // 디버깅
        if (!isUser && message.actionResult) {
          console.log('MessageList에서 actionResult 확인:', {
            messageId: message.messageId,
            messageActionResult: message.actionResult,
            sanitizedActionResult: sanitized.actionResult,
            finalActionResult: actionResult
          });
        }

        return (
          <div
            key={message.messageId}
            className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 px-2`}
          >
            <div
              className={`flex flex-col min-w-0 ${isUser ? "items-end" : "items-start"}`}
              style={{ maxWidth: typeof window !== 'undefined' && window.innerWidth < 768 ? '90%' : `${bubbleMaxPercent}%` }}
            >
              <div
                className={`px-3 py-2.5 md:px-4 md:py-3 rounded-xl break-words transition-all duration-200 overflow-wrap-anywhere text-sm md:text-base ${
                  isUser
                    ? "text-white border border-[#29F280]/40 hover:shadow-[0_4px_20px_rgba(41,242,128,0.4)] hover:border-[#29F280]/60"
                    : "text-white border border-[rgba(88,46,242,0.4)] hover:border-[rgba(88,46,242,0.6)] hover:shadow-[0_4px_20px_rgba(88,46,242,0.4)]"
                }`}
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  hyphens: "auto",
                  maxWidth: "100%",
                  willChange: "transform",
                  transform: "translateZ(0)",
                  background: isUser
                    ? "linear-gradient(135deg, rgba(41, 242, 128, 0.25) 0%, rgba(35, 114, 63, 0.2) 100%)"
                    : "linear-gradient(135deg, rgba(88, 46, 242, 0.2) 0%, rgba(69, 26, 210, 0.15) 100%)",
                  backdropFilter: "blur(12px)",
                  boxShadow: isUser
                    ? "0 2px 8px rgba(41, 242, 128, 0.15)"
                    : "0 2px 8px rgba(88, 46, 242, 0.15)",
                }}
              >
                {sanitized.contentType === "markdown" ? (
                  <MarkdownRenderer>{String(displayContent || "")}</MarkdownRenderer>
                ) : (
                  <p style={{ wordBreak: "break-word", overflowWrap: "anywhere", hyphens: "auto", margin: 0 }}>
                    {displayContent}
                  </p>
                )}
                {hasUrl && (
                  <div
                    className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{
                      background: "rgba(88, 46, 242, 0.15)",
                      border: "1px solid rgba(88, 46, 242, 0.3)",
                      color: "rgba(255, 255, 255, 0.85)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{t("urlContext.includeText")}</span>
                  </div>
                )}
                
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
                          await onActionApproved(message.messageId, proposedAction, result);
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
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                          {actionResult.output}
                        </pre>
                      </div>
                    )}
                    {actionResult.error && (
                      <div className="text-xs text-red-300 mt-1">
                        오류: {actionResult.error}
                      </div>
                    )}
                    {actionResult.simulation && (
                      <div className="text-xs text-yellow-300 mt-1">
                        ⚠️ 시뮬레이션 모드 (실제 실행되지 않음)
                      </div>
                    )}
                    {actionResult.auditId && (
                      <div className="text-xs text-gray-500 mt-2">
                        감사 ID: {actionResult.auditId}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "rgba(191, 202, 217, 0.6)" }}>
                  {timeLabel}
                </span>

                {!isUser && interactionId && (
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-0 flex-shrink-0"
                    style={{
                      background: isUser
                        ? "linear-gradient(135deg, rgba(41, 242, 128, 0.15) 0%, rgba(35, 114, 63, 0.12) 100%)"
                        : "linear-gradient(135deg, rgba(88, 46, 242, 0.15) 0%, rgba(69, 26, 210, 0.12) 100%)",
                      backdropFilter: "blur(10px)",
                      border: isUser
                        ? "1px solid rgba(41, 242, 128, 0.3)"
                        : "1px solid rgba(88, 46, 242, 0.3)",
                      color: "rgba(255, 255, 255, 0.95)",
                      boxShadow: isUser
                        ? "0 2px 6px rgba(41, 242, 128, 0.1)"
                        : "0 2px 6px rgba(88, 46, 242, 0.1)",
                    }}
                    onMouseEnter={(event) => {
                      if (isUser) {
                        event.currentTarget.style.background =
                          "linear-gradient(135deg, rgba(41, 242, 128, 0.25) 0%, rgba(35, 114, 63, 0.2) 100%)";
                        event.currentTarget.style.borderColor = "rgba(41, 242, 128, 0.5)";
                        event.currentTarget.style.boxShadow = "0 4px 12px rgba(41, 242, 128, 0.2)";
                      } else {
                      event.currentTarget.style.background =
                        "linear-gradient(135deg, rgba(88, 46, 242, 0.25) 0%, rgba(69, 26, 210, 0.2) 100%)";
                      event.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.5)";
                      event.currentTarget.style.boxShadow = "0 4px 12px rgba(88, 46, 242, 0.2)";
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (isUser) {
                        event.currentTarget.style.background =
                          "linear-gradient(135deg, rgba(41, 242, 128, 0.15) 0%, rgba(35, 114, 63, 0.12) 100%)";
                        event.currentTarget.style.borderColor = "rgba(41, 242, 128, 0.3)";
                        event.currentTarget.style.boxShadow = "0 2px 6px rgba(41, 242, 128, 0.1)";
                      } else {
                      event.currentTarget.style.background =
                        "linear-gradient(135deg, rgba(88, 46, 242, 0.15) 0%, rgba(69, 26, 210, 0.12) 100%)";
                      event.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.3)";
                      event.currentTarget.style.boxShadow = "0 2px 6px rgba(88, 46, 242, 0.1)";
                      }
                    }}
                    type="button"
                    aria-label="How was this generated?"
                    onClick={() => onToggleTrace(interactionId)}
                    disabled={traceLoadingId === interactionId}
                  >
                    <IconInfo width={14} height={14} className="flex-shrink-0" />
                    <span>{t("traceButton")}</span>
                  </button>
                )}

                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-0 flex-shrink-0"
                  style={{
                    background: isUser
                      ? "linear-gradient(135deg, rgba(41, 242, 128, 0.15) 0%, rgba(35, 114, 63, 0.12) 100%)"
                      : "linear-gradient(135deg, rgba(88, 46, 242, 0.15) 0%, rgba(69, 26, 210, 0.12) 100%)",
                    backdropFilter: "blur(10px)",
                    border: isUser
                      ? "1px solid rgba(41, 242, 128, 0.3)"
                      : "1px solid rgba(88, 46, 242, 0.3)",
                    color: "rgba(255, 255, 255, 0.95)",
                    boxShadow: isUser
                      ? "0 2px 6px rgba(41, 242, 128, 0.1)"
                      : "0 2px 6px rgba(88, 46, 242, 0.1)",
                  }}
                  onMouseEnter={(event) => {
                    if (isUser) {
                    event.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(41, 242, 128, 0.25) 0%, rgba(35, 114, 63, 0.2) 100%)";
                    event.currentTarget.style.borderColor = "rgba(41, 242, 128, 0.5)";
                    event.currentTarget.style.boxShadow = "0 4px 12px rgba(41, 242, 128, 0.2)";
                    } else {
                      event.currentTarget.style.background =
                        "linear-gradient(135deg, rgba(88, 46, 242, 0.25) 0%, rgba(69, 26, 210, 0.2) 100%)";
                      event.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.5)";
                      event.currentTarget.style.boxShadow = "0 4px 12px rgba(88, 46, 242, 0.2)";
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (isUser) {
                    event.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(41, 242, 128, 0.15) 0%, rgba(35, 114, 63, 0.12) 100%)";
                    event.currentTarget.style.borderColor = "rgba(41, 242, 128, 0.3)";
                    event.currentTarget.style.boxShadow = "0 2px 6px rgba(41, 242, 128, 0.1)";
                    } else {
                      event.currentTarget.style.background =
                        "linear-gradient(135deg, rgba(88, 46, 242, 0.15) 0%, rgba(69, 26, 210, 0.12) 100%)";
                      event.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.3)";
                      event.currentTarget.style.boxShadow = "0 2px 6px rgba(88, 46, 242, 0.1)";
                    }
                  }}
                  type="button"
                  aria-label="Copy message"
                  onClick={() => onCopyMessage(message)}
                  disabled={copyBusyId === message.messageId}
                >
                  <IconCopy width={14} height={14} className="flex-shrink-0" />
                  <span>
                    {copiedMessageId === message.messageId
                      ? t("copied")
                      : t("copy")}
                  </span>
                </button>
              </div>

              {(() => {
                if (traceData && traceOpen) {
                  console.log("traceData:", traceData);
                }
                return null;
              })()}
              {hasTraceData && traceOpen && (
                <div className="mt-2 w-full rounded-xl border border-[rgba(88,46,242,0.3)] bg-[rgba(88,46,242,0.12)] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs text-[#BFCAD9] font-medium">
                      <IconHistory width={14} height={14} />
                      <span>{t("traceTitle")}</span>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-[#BFCAD9] hover:text-white transition-colors"
                      onClick={() => onToggleTrace(interactionId)}
                    >
                      {t("close")}
                    </button>
                  </div>

                  <div className="mt-2 space-y-2 text-xs text-white">
                    {/* API 응답이 배열인 경우 */}
                    {Array.isArray(traceData) && traceData.length > 0 ? (
                      traceData.map((step: any, index: number) => {
                          const isOpen = openSteps.includes(index);
                          return (
                            <div key={index} className="rounded border border-[rgba(88,46,242,0.2)] bg-black/10">
                              <button
                                type="button"
                                className="w-full flex items-center justify-between px-3 py-2 text-left text-white"
                                onClick={() => onToggleTraceStep(interactionId, index)}
                              >
                                <span className="font-semibold mr-2">
                                  {step.traceNumber ? `Trace ${step.traceNumber}` : `Step ${index + 1}`} - {step.origin || step.name || step.type || "LLM"}
                                </span>
                                <IconChevron className={`ml-2 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                              </button>
                              {isOpen && (
                                <div className="pl-3 pb-2 space-y-1">
                                  {step.input && (
                                    <div className="mb-2">
                                      <b className="text-white">Input:</b>
                                      <div className="mt-1">
                                        <MarkdownRenderer>{formatStepField(step.input)}</MarkdownRenderer>
                                      </div>
                                    </div>
                                  )}
                                  {step.output && (
                                    <div className="mb-2">
                                      <b className="text-white">Output:</b>
                                      <div className="mt-1">
                                        <MarkdownRenderer>{formatStepField(step.output)}</MarkdownRenderer>
                                      </div>
                                    </div>
                                  )}
                                  {step.createTime && (
                                    <div className="mb-1 text-xs text-white/60">
                                      <b>Time:</b> {new Date(step.createTime).toLocaleString('ko-KR')}
                                    </div>
                                  )}
                                  {step.thought && (
                                    <div className="mb-1">
                                      <b>Thought:</b> <span className="break-all">{formatStepField(step.thought)}</span>
                                    </div>
                                  )}
                                  {step.action && (
                                    <div className="mb-1">
                                      <b>Action:</b> <span className="break-all">{formatStepField(step.action)}</span>
                                    </div>
                                  )}
                                  {step.action_input && (
                                    <div className="mb-1">
                                      <b>Action Input:</b> <span className="break-all">{formatStepField(step.action_input)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-white/60 py-2 px-3">
                          추적 데이터가 없습니다.
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="flex justify-start mb-2">
          <LoaderDots />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function formatStepField(field: unknown): string {
  if (field == null) return "";
  if (typeof field === "string") return field;
  try {
    return JSON.stringify(field, null, 2);
  } catch {
    return String(field);
  }
}
