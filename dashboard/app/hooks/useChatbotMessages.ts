/**
 * 챗봇 메시지 관리를 위한 커스텀 훅
 */

import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from "uuid";
import { sendChatbotMessage } from "@/app/services/chatbot";
import type { ChatbotMessage, ChatbotRequest } from "@/types/chatbot";
import { sanitizeMessageContent, hasMarkdownSyntax } from "@/app/components/chatbot/utils/chatbotHelpers";

const CHATBOT_STATE_KEY = 'CHATBOT_STATE';

/**
 * 챗봇 메시지 상태 관리 훅
 * 
 * 메시지 목록, 대화 ID, 로딩 상태 등을 관리합니다.
 */
export function useChatbotMessages() {
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 메시지 전송
   * 
   * @param inputText - 전송할 메시지 텍스트
   * @param urlContext - URL 컨텍스트 (선택 사항)
   * @param t - 번역 함수
   */
  const handleSend = useCallback(async (
    inputText: string,
    urlContext: { url: string; displayText: string } | null,
    t: (key: string) => string
  ) => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");

    const now = new Date();
    
    // URL 컨텍스트가 있으면 메시지 앞에 추가
    let finalContent = inputText;
    if (urlContext) {
      finalContent = `현재 사용자는 ${urlContext.url}에서 질문하고 있음을 고려해서 답변해주세요\n\nUser: ${inputText}`;
    }
    
    const userMsg: ChatbotMessage = {
      messageId: uuidv4(),
      type: "input",
      content: finalContent,
      contentType: "markdown",
      createdAt: now.toISOString(),
    };

    // Optimistic: 사용자 메시지 즉시 추가
    const displayMsg: ChatbotMessage = {
      ...userMsg,
      content: inputText, // 표시용으로는 원본 텍스트 사용
    };
    setMessages((prev) => [...prev, displayMsg]);

    const req: ChatbotRequest = {
      messages: [...messages, displayMsg],
      input: {
        type: "input",
        content: finalContent,
        contentType: "text",
        context: { appId: "home" },
      },
      conversationId,
    };

    let currentConversationId = conversationId;
    
    const stopPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
    
    try {
      const res = await sendChatbotMessage(req);
      currentConversationId = res?.conversationId;
      
      if (currentConversationId) {
        setConversationId(currentConversationId);
      }
      
      const assistantMessages = (res?.messages ?? []).filter((m) => m.type !== "input");
      if (!assistantMessages.length && currentConversationId) {
        // 서버가 처리했지만 응답이 비어있을 경우 폴링 시작
        const pollForMessages = async () => {
          try {
            const res = await fetch(`/api/opensearch-dashboards/assistant/conversation/${currentConversationId}`);
            if (!res.ok) return;
            
            const data = await res.json();
            if (data?.messages && Array.isArray(data.messages)) {
              const newAssistantMessages = data.messages.filter((m: ChatbotMessage) => m.type !== "input");
              if (newAssistantMessages.length > 0) {
                stopPolling();
                setMessages((prev) => {
                  const existingIds = new Set(prev.map(m => m.messageId));
                  const uniqueMessages = newAssistantMessages.filter((m: ChatbotMessage) => !existingIds.has(m.messageId));
                  if (uniqueMessages.length > 0) {
                    return [
                      ...prev,
                      ...uniqueMessages.map((m: ChatbotMessage) => {
                        const shouldBeMarkdown = hasMarkdownSyntax(m.content || '');
                        const sanitizedMsg = sanitizeMessageContent({
                          ...m,
                          contentType: shouldBeMarkdown ? 'markdown' : (m.contentType || 'text'),
                          interactionId: m.interactionId ?? undefined,
                          createdAt: m.createdAt || new Date().toISOString(),
                        });
                        return sanitizedMsg;
                      }),
                    ];
                  }
                  return prev;
                });
              }
            }
          } catch (e) {
            console.error("Polling error:", e);
          }
        };
        
        pollForMessages();
        let pollCount = 0;
        const MAX_POLL_COUNT = 60;
        pollIntervalRef.current = setInterval(() => {
          pollCount++;
          if (pollCount >= MAX_POLL_COUNT) {
            stopPolling();
            setError(t("error"));
          } else {
            pollForMessages();
          }
        }, 2000);
      } else if (assistantMessages.length > 0) {
        setMessages((prev) => [
          ...prev,
          ...assistantMessages.map((m) => {
            const shouldBeMarkdown = hasMarkdownSyntax(m.content || '');
            const sanitizedMsg = sanitizeMessageContent({
              ...m,
              contentType: shouldBeMarkdown ? 'markdown' : (m.contentType || 'text'),
              interactionId: m.interactionId ?? undefined,
              createdAt: m.createdAt || now.toISOString(),
            });
            return sanitizedMsg;
          }),
        ]);
      } else {
        setError(t("error"));
      }
    } catch (e) {
      setError(t("error"));
      stopPolling();
    } finally {
      setLoading(false);
    }
  }, [messages, conversationId]);

  /**
   * 상태 저장
   */
  const saveState = useCallback(() => {
    try {
      const state = {
        messages,
        conversationId,
        timestamp: Date.now()
      };
      localStorage.setItem(CHATBOT_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage 접근 실패 시 무시
    }
  }, [messages, conversationId]);

  /**
   * 상태 복원
   */
  const restoreState = useCallback(async () => {
    try {
      const saved = localStorage.getItem(CHATBOT_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.timestamp && Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          if (state.messages) setMessages(state.messages);
          if (state.conversationId) setConversationId(state.conversationId);
          return true;
        }
      }
    } catch (e) {
      console.error('상태 복원 실패:', e);
    }
    return false;
  }, []);

  // 컴포넌트 언마운트 시 폴링 정리
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  return {
    messages,
    setMessages,
    conversationId,
    setConversationId,
    loading,
    error,
    setError,
    isInitialized,
    setIsInitialized,
    handleSend,
    saveState,
    restoreState,
    cleanup,
  };
}

