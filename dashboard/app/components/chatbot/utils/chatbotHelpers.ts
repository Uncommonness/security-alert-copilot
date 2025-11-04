/**
 * 챗봇 관련 유틸리티 함수들
 */

import type { ChatbotMessage } from '@/types/chatbot';
import { sanitizeByContentType, needsSanitization } from '@/lib/textSanitizer';

/**
 * 메시지에서 평문 텍스트를 추출합니다.
 * 
 * 마크다운 형식의 메시지도 HTML을 파싱하여 텍스트만 추출합니다.
 * 
 * @param msg - 추출할 메시지
 * @returns 평문 텍스트
 */
export function extractPlainText(msg: ChatbotMessage): string {
  if (!msg) return "";
  if (msg.contentType === "markdown") {
    const tmp = document.createElement("div");
    tmp.innerHTML = msg.content ?? "";
    return tmp.textContent || tmp.innerText || "";
  }
  return msg.content ?? "";
}

/**
 * 텍스트에 마크다운 문법이 포함되어 있는지 확인합니다.
 * 
 * @param content - 확인할 텍스트
 * @returns 마크다운 문법 포함 여부
 */
export function hasMarkdownSyntax(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  // 마크다운 문법 패턴 체크
  const markdownPatterns = [
    /^#{1,6}\s/m,           // 제목 (#, ##, ### 등)
    /\*\*.*?\*\*/,           // 굵게 (**text**)
    /\*.*?\*/,               // 기울임 (*text*)
    /```[\s\S]*?```/,        // 코드 블록
    /`[^`]+`/,               // 인라인 코드
    /\[.*?\]\(.*?\)/,        // 링크 [text](url)
    /^\s*[-*+]\s/m,          // 리스트 (-, *, +)
    /^\s*\d+\.\s/m,          // 번호 리스트
    /^>\s/m,                  // 인용문 (>)
  ];
  return markdownPatterns.some(pattern => pattern.test(content));
}

/**
 * URL 컨텍스트가 포함된 메시지인지 확인합니다.
 * 
 * @param content - 확인할 텍스트
 * @returns URL 컨텍스트 포함 여부
 */
export function hasUrlContext(content: string): boolean {
  return content.includes('현재 사용자는') && content.includes('에서 질문하고 있음을 고려해서 답변해주세요');
}

/**
 * URL 컨텍스트를 제거하고 실제 사용자 메시지만 추출합니다.
 * 
 * @param content - 원본 메시지 내용
 * @returns 추출된 사용자 메시지
 */
export function extractUserMessage(content: string): string {
  if (!hasUrlContext(content)) return content;
  
  // "User: " 이후의 내용을 추출
  const userIndex = content.indexOf('User: ');
  if (userIndex !== -1) {
    return content.substring(userIndex + 6).trim();
  }
  
  return content;
}

/**
 * 메시지 내용을 정리합니다.
 * 
 * actionResult와 proposedAction 같은 중요한 필드는 항상 보존합니다.
 * 텍스트 정리가 필요한 경우에만 sanitizeByContentType을 사용합니다.
 * 
 * @param msg - 정리할 메시지
 * @returns 정리된 메시지
 */
export function sanitizeMessageContent(msg: ChatbotMessage): ChatbotMessage {
  if (!msg) return msg;
  
  // actionResult와 proposedAction은 항상 보존
  const preservedFields = {
    actionResult: msg.actionResult,
    proposedAction: msg.proposedAction,
    interactionId: msg.interactionId,
    messageId: msg.messageId,
    type: msg.type,
    contentType: msg.contentType,
    createdAt: msg.createdAt
  };
  
  if (!msg.content) {
    return { ...msg, ...preservedFields };
  }
  
  // 텍스트 정리가 필요한지 확인 (더 엄격한 조건)
  if (needsSanitization(msg.content)) {
    console.log('텍스트 정리 적용:', msg.content.substring(0, 100) + '...');
    const sanitizedContent = sanitizeByContentType(msg.content, msg.contentType);
    return {
      ...msg,
      content: sanitizedContent,
      ...preservedFields
    };
  }
  
  return { ...msg, ...preservedFields };
}

