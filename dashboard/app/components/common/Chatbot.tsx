"use client";
// 기존 import들 아래에 추가
import { createPortal } from "react-dom";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { copyToClipboard as utilCopyToClipboard } from '@/lib/clipboard';
import { ChatbotScrollAreaView } from '@/app/components/chatbot/ScrollAreaView';
import { SettingsPanel, type FontSizeOption } from '@/app/components/chatbot/SettingsPanel';
import { HistoryPanel } from '@/app/components/chatbot/HistoryPanel';
import { MessageList } from '@/app/components/chatbot/MessageList';
import { ConversationSummary, EditModalState, DeleteModalState } from '@/app/components/chatbot/types';
import { v4 as uuidv4 } from "uuid";
import { sendChatbotMessage } from "@/app/services/chatbot";
import type {
  ChatbotMessage,
  ChatbotRequest,
  ChatbotAction,
  ProposedAction,
} from "@/types/chatbot";
import type { ActionResult } from "@/types/actions";
import { useTranslations } from "next-intl";
import { useAssistant } from '@/app/providers/assistant-store';
// 최상단 import들 사이에 추가
import MentionPopover from "@/app/components/common/MentionPopover";
import { IconClose } from '@/app/components/icons/Icons';
import AssistantResizer from '@/app/ui/assistant-resizer';
import {
  extractPlainText,
  hasMarkdownSyntax,
  hasUrlContext,
  extractUserMessage,
  sanitizeMessageContent,
} from '@/app/components/chatbot/utils/chatbotHelpers';

// NOTE: global animation styles (chatbot-bounce) should live in `app/globals.css`.
// Removed runtime injection to reduce bundle noise.

// NOTE: selection hiding can be harmful for accessibility; if required, move to `app/globals.css`
// and enable behind a feature flag. Runtime injection removed.
type ChatbotProps = {
  scrollAreaOnly?: boolean;
  embedded?: boolean;
};

// clipboard util lives in @/lib/clipboard (imported as utilCopyToClipboard)

export default function Chatbot({ scrollAreaOnly = false, embedded = false }: ChatbotProps) {
  // allow parent to render its own header when embedded in floating panel
  // `embedded` prop intentionally controls whether Chatbot should perform any
  // sidecar/docking related side-effects (portals, --assistant-width sync, etc.)
  // 사용자 설정: 불투명도, 글씨 크기
  const [opacity, setOpacity] = React.useState<number>(0.98);
  const [fontSize, setFontSize] = React.useState<FontSizeOption>("text-base");
  // 상태 선언 (최상단에 연속적으로)
  // 메시지별 trace 전체 오픈 여부
  const [traceOpenMap, setTraceOpenMap] = React.useState<
    Record<string, boolean>
  >({});
  // 메시지별 step 오픈 인덱스(여러 개 동시 오픈 가능)
  const [openStepMap, setOpenStepMap] = React.useState<
    Record<string, number[]>
  >({});
  const [messages, setMessages] = React.useState<ChatbotMessage[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const t = useTranslations("chatbot");
  const { close: closeAssistant, width: assistantWidth, setWidth: setAssistantWidth } = useAssistant();
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<
    string | undefined
  >();
  const [error, setError] = React.useState("");
  
  // 폴링 interval 참조
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [itemsPerPage] = React.useState(20);
  
  // 로딩 상태
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");
  
  // 챗봇 상태 저장/복원을 위한 키
  const CHATBOT_STATE_KEY = 'CHATBOT_STATE';
  
  // 챗봇 상태 저장 함수 (디바운싱 적용)
  const saveChatbotState = React.useCallback(() => {
    try {
      const state = {
        messages,
        conversationId,
        input,
        traceOpenMap,
        openStepMap,
        // urlContext는 의도적으로 저장하지 않음 - 새 채팅/과거 채팅 시 항상 초기화되어야 함
        timestamp: Date.now()
      };
      localStorage.setItem(CHATBOT_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage 접근 실패 시 무시
    }
  }, [messages, conversationId, input, traceOpenMap, openStepMap]);
  
  // 디바운싱된 저장 함수
  const debouncedSaveState = React.useCallback(() => {
    const timeoutId = setTimeout(() => {
      saveChatbotState();
    }, 500); // 500ms 디바운싱
    
    return () => clearTimeout(timeoutId);
  }, [saveChatbotState]);
  
  // OpenSearch에서 대화 내역 불러오기
  const loadConversationFromOpenSearch = React.useCallback(async (convId: string) => {
    try {
      const res = await fetch(
        `/api/opensearch-dashboards/assistant/conversation/${convId}`
      );
      if (!res.ok) {
        console.error('대화 내역 불러오기 실패:', res.status);
        return false;
      }
      const data = await res.json();
      const conversationMessages: ChatbotMessage[] = Array.isArray(data.messages)
        ? data.messages
        : [];
      
      // 메시지 sanitize 및 createdAt 설정
      const sanitizedMessages = conversationMessages.map((message, index) => {
        // 마크다운 문법이 있으면 contentType을 markdown으로 설정
        const shouldBeMarkdown = hasMarkdownSyntax(message.content || '');
        const messageWithContentType = {
          ...message,
          contentType: shouldBeMarkdown ? 'markdown' : (message.contentType || 'text'),
        };

        const sanitized = sanitizeMessageContent(messageWithContentType);
        
        // content에서 action_result_data 주석 파싱 (OpenSearch에 저장된 경우)
        if (sanitized.content && typeof sanitized.content === 'string') {
          const actionResultMatch = sanitized.content.match(/<!-- action_result_data: ({.*?}) -->/);
          if (actionResultMatch && !sanitized.actionResult) {
            try {
              const actionData = JSON.parse(actionResultMatch[1]);
              // actionResult 정보 복원
              if (actionData.result) {
                sanitized.actionResult = actionData.result;
              }
              // proposedAction 정보 복원
              if (actionData.action) {
                sanitized.proposedAction = {
                  action: actionData.action,
                  params: actionData.params || {},
                  description: actionData.result?.description || ''
                };
              }
            } catch (e) {
              console.warn('action_result_data 파싱 실패:', e);
            }
          }
        }
        
        if (!sanitized.createdAt) {
          const baseTime = new Date(data.updatedTimeMs || Date.now());
          const messageTime = new Date(
            baseTime.getTime() - (conversationMessages.length - index) * 60000
          );
          sanitized.createdAt = messageTime.toISOString();
        }
        return sanitized;
      });
      
      setMessages(sanitizedMessages);
      setConversationId(convId);
      console.log('OpenSearch에서 대화 내역 불러오기 완료:', sanitizedMessages.length, '개 메시지');
      return true;
    } catch (error) {
      console.error('대화 내역 불러오기 실패:', error);
      return false;
    }
  }, []);

  // 챗봇 상태 복원 함수 (conversationId가 있으면 OpenSearch에서 불러오기)
  const restoreChatbotState = React.useCallback(async () => {
    try {
      const saved = localStorage.getItem(CHATBOT_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        // 24시간 이내의 상태만 복원 (너무 오래된 상태는 무시)
        if (state.timestamp && Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          // conversationId가 있으면 OpenSearch에서 불러오기 (최신 상태 보장)
          if (state.conversationId) {
            const loaded = await loadConversationFromOpenSearch(state.conversationId);
            if (loaded) {
              // OpenSearch에서 불러온 경우, 입력창과 UI 상태만 복원
              if (state.input) setInput(state.input);
              if (state.traceOpenMap) setTraceOpenMap(state.traceOpenMap);
              if (state.openStepMap) setOpenStepMap(state.openStepMap);
              return true;
            }
            // OpenSearch에서 불러오기 실패 시 localStorage에서 복원 (fallback)
          }
          
          // conversationId가 없거나 OpenSearch 로드 실패 시 localStorage에서 복원
          if (state.messages) setMessages(state.messages);
          if (state.conversationId) setConversationId(state.conversationId);
          if (state.input) setInput(state.input);
          if (state.traceOpenMap) setTraceOpenMap(state.traceOpenMap);
          if (state.openStepMap) setOpenStepMap(state.openStepMap);
          // urlContext는 의도적으로 복원하지 않음 - 항상 초기화된 상태로 시작
          return true; // 상태가 복원됨
        }
      }
    } catch (e) {
      // JSON 파싱 실패 시 무시
      console.error('상태 복원 실패:', e);
    }
    return false; // 상태가 복원되지 않음
  }, [loadConversationFromOpenSearch]);
  
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // 트리거 문자
  const TRIGGERS = ["/", "#", "@"] as const;
  type Trigger = (typeof TRIGGERS)[number];

  const inputRef = React.useRef<HTMLTextAreaElement | null>(null); // NEW
  const inputMaxHeightRef = React.useRef<number | null>(null);
  const overlayInnerRef = React.useRef<HTMLDivElement | null>(null);
  const sendBtnRef = React.useRef<HTMLButtonElement | null>(null); // NEW

  // 포커스 함수를 외부에서 호출할 수 있도록 전역에 등록
  React.useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    };
    
    // 전역 함수로 등록
    (window as any).focusChatbotInput = focusInput;
    
    return () => {
      delete (window as any).focusChatbotInput;
    };
  }, []);
  // debugInfo and keyLog removed for production cleanliness
  const [overlayStyle, setOverlayStyle] = React.useState<React.CSSProperties>(
    {}
  );
  // computedPaddingRight removed; overlayStyle is authoritative

  // Sidecar docking state / portal support
  const SIDECAR_LS_KEY = "CHATBOT_DOCKED";
  const [docked, setDocked] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const ls = localStorage.getItem(SIDECAR_LS_KEY) === "1";
      // debug override: use ?chatdock=1 to force dock on page load for testing
      try {
        const url = new URL(window.location.href);
        const param = url.searchParams.get('chatdock');
        if (param === '1') return true;
      } catch (e) {}
      return ls;
    } catch { return false; }
  });
  const [sidecarEl, setSidecarEl] = React.useState<HTMLElement | null>(null);
  const [sidecarState, setSidecarState] = React.useState<"enter"|"leave">("enter");
  const SIDECAR_WIDTH_LS_KEY = "CHATBOT_WIDTH";
  const sidecarRef = React.useRef<HTMLDivElement | null>(null);
  const resizingRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (docked) html.setAttribute("data-sidecar", "right-open");
    else html.removeAttribute("data-sidecar");
    try { localStorage.setItem(SIDECAR_LS_KEY, docked ? "1" : "0"); } catch {}
  }, [docked]);

  React.useEffect(() => {
    const onToggle = () => setDocked(v => !v);
    const onOpen = () => setDocked(true);
    const onClose = () => setDocked(false);
    window.addEventListener("chatbot:toggleDock", onToggle as EventListener);
    window.addEventListener("chatbot:openDock", onOpen as EventListener);
    window.addEventListener("chatbot:closeDock", onClose as EventListener);
    return () => {
      window.removeEventListener("chatbot:toggleDock", onToggle as EventListener);
      window.removeEventListener("chatbot:openDock", onOpen as EventListener);
      window.removeEventListener("chatbot:closeDock", onClose as EventListener);
    };
  }, []);

  // URL 감지 및 자동 멘션 추가 (자동 설정 비활성화)
  // 주석: 자동 URL 컨텍스트 설정을 비활성화하여 사용자가 수동으로 @링크제공을 선택해야만 적용되도록 함
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    // URL 변경 감지 기능은 유지하되, 자동 설정은 하지 않음
    // 사용자가 수동으로 @링크제공을 선택할 때만 URL 컨텍스트가 설정됨
    
    // 브라우저 뒤로가기/앞으로가기 감지
    const handlePopState = () => {
      // URL 변경은 감지하되 자동으로 URL 컨텍스트를 설정하지 않음
      // 필요시 향후 확장 가능
    };
    
    // pushState/replaceState 감지를 위한 커스텀 이벤트 리스너
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      // 자동 설정하지 않음
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      // 자동 설정하지 않음
    };
    
    // 이벤트 리스너 등록
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []); // 의존성 배열을 비워서 초기화 문제 해결

  // 컴포넌트 마운트 시 챗봇 상태 복원
  React.useEffect(() => {
    const initializeState = async () => {
      const restored = await restoreChatbotState();
      if (!restored) {
        // 상태가 복원되지 않았을 때는 빈 메시지로 설정하여 환영 메시지가 표시되도록 함
        setMessages([]);
      }
      setIsInitialized(true);
    };
    initializeState();
  }, [restoreChatbotState, t]);

  // 상태 변경 시 자동 저장 (디바운싱 적용)
  React.useEffect(() => {
    const cleanup = debouncedSaveState();
    return cleanup;
  }, [debouncedSaveState]);

  // 과거 대화방 목록
  const [showHistory, setShowHistory] = React.useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = React.useState(false);
  // 환영 메시지 애니메이션 상태
  const [showWelcomeAnimation, setShowWelcomeAnimation] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    let host = document.getElementById("chatbot-sidecar-root") as HTMLElement | null;
    if (!host) {
      host = document.createElement("div");
      host.id = "chatbot-sidecar-root";
      document.body.appendChild(host);
    }
    setSidecarEl(host);
  }, []);

  // persist width when changed
  React.useEffect(() => {
    try { localStorage.setItem(SIDECAR_WIDTH_LS_KEY, assistantWidth.toString()); } catch(e){}
  }, [assistantWidth]);

  // Keep the --assistant-width CSS variable in sync on the element with class `app-grid`.
  // Many layouts reference this variable; update it whenever assistantWidth or docked changes.
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    // When Chatbot is embedded in another UI (e.g. AssistantPanel), do not
    // perform any portal/docking/width CSS variable side-effects. The panel
    // component is responsible for controlling `--assistant-width`.
    if (embedded) return;
    try {
      const el = document.querySelector('.app-grid') as HTMLElement | null;
      if (el) {
        el.style.setProperty('--assistant-width', `${assistantWidth}px`);
      } else {
        document.documentElement.style.setProperty('--assistant-width', `${assistantWidth}px`);
      }
    } catch (e) {}
    return () => {
      try {
        const el = document.querySelector('.app-grid') as HTMLElement | null;
        if (el) el.style.removeProperty('--assistant-width');
        document.documentElement.style.removeProperty('--assistant-width');
      } catch (e) {}
    };
  }, [assistantWidth, docked, embedded]);

  // 리사이즈 후 렌더링 문제 해결을 위한 강제 리렌더링
  React.useEffect(() => {
    const handleResize = () => {
      // 리사이즈 후 약간의 지연을 두고 강제 리렌더링
      setTimeout(() => {
        setForceRender(prev => prev + 1);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug logs removed for production

  // 멘션 상태
  const [mention, setMention] = React.useState<{
    open: boolean;
    trigger?: Trigger;
    start?: number;
    query: string;
  }>({ open: false, query: "" }); // NEW
  const [suggestions, setSuggestions] = React.useState<string[]>([]); // NEW
  const [activeIdx, setActiveIdx] = React.useState(0); // NEW
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null); // NEW
  const programmaticRef = React.useRef(false);
  const [isComposing, setIsComposing] = React.useState(false);
  const [forceRender, setForceRender] = React.useState(0);
  
  // 페이지네이션 함수
  const handlePageChange = React.useCallback(async (page: number) => {
    if (!mention.open || !mention.query) return;
    
    setCurrentPage(page);
    const raw = mention.query.trim();
    const lower = raw.toLowerCase();
    
    try {
      let items: string[] = [];
      
      // @문서 or @문서:term => use existing opensearch indices API
      if (lower === "문서" || lower.startsWith("문서:")) {
        setIsLoadingSuggestions(true);
        setLoadingMessage(t('chatbot.mention.documentLoading'));
        
        let term = raw.slice(2); // "문서"는 2글자 (로케일별로 길이가 다를 수 있음)
        if (term.startsWith(":")) term = term.slice(1);
        term = term.trim();
        const q = term ? `*${term}*` : "*";
        const r = await fetch(
          `/api/opensearch/indices?q=${encodeURIComponent(q)}&page=${page}&size=${itemsPerPage}`
        );
        const j = await r.json();
        items = Array.isArray(j.indices) ? j.indices : [];
        setTotalItems(j.total || items.length);
        setTotalPages(Math.ceil((j.total || items.length) / itemsPerPage));
      }
      
      setSuggestions(items);
      // suggestions가 있을 때만 activeIdx를 0으로 설정
      if (items.length > 0) {
        setActiveIdx(0);
      }
    } catch (err) {
      console.error('페이지 로드 실패:', err);
    } finally {
      setIsLoadingSuggestions(false);
      setLoadingMessage("");
    }
  }, [mention.open, mention.query, itemsPerPage]);
  
  // 페이지네이션 상태 초기화 함수
  const resetPaginationState = React.useCallback(() => {
    setCurrentPage(1);
    setTotalPages(1);
    setTotalItems(0);
    setIsLoadingSuggestions(false);
    setLoadingMessage("");
  }, []);
  
  // URL 컨텍스트 상태
  const [urlContext, setUrlContext] = React.useState<{
    url: string;
    displayText: string;
  } | null>(null);
  // Edit modal state for conversation title
  const [editModal, setEditModal] = React.useState<EditModalState>(() => ({ open: false, title: "" }));
  const [editSaving, setEditSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  // Delete modal state
  const [deleteModal, setDeleteModal] = React.useState<DeleteModalState>(() => ({ open: false, title: "" }));
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  // Helper to get freshest input value (prefer DOM value when present)
  const getCurrentInput = () => inputRef.current?.value ?? input;

  const getPanelWidth = React.useCallback(() => {
    const width = assistantWidth || 400;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth - 32 : 400;
    return Math.min(width, viewportWidth);
  }, [assistantWidth]);

  const computedPanelWidth = React.useMemo(() => {
    const base = getPanelWidth();
    const viewport = typeof window !== 'undefined' ? window.innerWidth - 150 : base;
    const candidate = Math.min(base - 50, viewport);
    return Math.max(220, candidate);
  }, [getPanelWidth, forceRender]);

  const messageBubbleMaxPercent = React.useMemo(() => {
    const base = getPanelWidth();
    if (base <= 0) return 75;
    const percent = ((base - 80) / base) * 100;
    return Math.min(75, Math.max(50, percent));
  }, [getPanelWidth, forceRender]);

  // DEBUG: report mount and textarea presence to help diagnose invisible input (safe: logs only)
  // Debug mount checks removed to reduce noise in production. If needed, re-enable
  // behind a development-only guard.

  // attach keydown listener to textarea to observe keys even if UI doesn't render text
  // Key logging removed

  // debugInfo updates removed

  function replaceInput(newInput: string, caretPos?: number, preserveScroll = false, onDone?: () => void) {
    // For uncontrolled textarea (defaultValue + onInput) the DOM value
    // must be updated directly so programmatic inserts are visible.
    programmaticRef.current = true;
    try {
      if (inputRef.current) {
        try {
          // capture current scrollTop when preservation requested
          const ta = inputRef.current;
          const prevScrollTop = preserveScroll ? ta.scrollTop : undefined;
          // update DOM value immediately
          ta.value = newInput;
          // auto-resize if needed but cap to max height
          ta.style.height = 'auto';
          const maxH = inputMaxHeightRef.current ?? Infinity;
          const desired = Math.min(ta.scrollHeight, maxH);
          ta.style.height = `${desired}px`;
          if (ta.scrollHeight > maxH) {
            ta.style.overflow = 'auto';
            if (!preserveScroll) {
              // ensure caret is visible by scrolling to bottom only when not preserving
              ta.scrollTop = ta.scrollHeight;
            } else if (typeof prevScrollTop === 'number') {
              // restore previous scroll position
              ta.scrollTop = prevScrollTop;
            }
          } else {
            ta.style.overflow = 'hidden';
            if (preserveScroll && typeof prevScrollTop === 'number') {
              ta.scrollTop = prevScrollTop;
            }
          }
              // Defer caret placement using two rAFs so the browser/IME has time to settle.
              // Also add a microtask fallback (setTimeout 0) in case rAFs are skipped.
              if (typeof caretPos === "number") {
                const ta = inputRef.current!;
                const setCaret = () => {
                  try {
                    if (!ta) return;
                    // attempt to focus without scrolling when preserving
                    try {
                      if (preserveScroll && typeof prevScrollTop === 'number') {
                        // prefer preventScroll option when available
                        (ta as any).focus({ preventScroll: true });
                      } else if (document.activeElement !== ta) {
                        ta.focus();
                      }
                    } catch (e) {
                      if (document.activeElement !== ta) ta.focus();
                    }
                    ta.setSelectionRange(caretPos, caretPos);
                    // If preserving scroll, restore it after browser may have adjusted viewport
                    if (preserveScroll && typeof prevScrollTop === 'number') {
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          try { ta.scrollTop = prevScrollTop; } catch (e) {}
                        });
                      });
                    }
                  } catch (e) {}
                };
                // two-frame delay
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setCaret();
                    try { onDone?.(); } catch (e) {}
                  });
                });
                // microtask fallback
                setTimeout(() => {
                  try {
                    setCaret();
                    try { onDone?.(); } catch (e) {}
                  } catch (e) {}
                }, 0);
              } else {
                requestAnimationFrame(() => {
                  try {
                    inputRef.current?.focus({ preventScroll: true });
                    try { onDone?.(); } catch (e) {}
                  } catch (e) {}
                });
              }
        } catch (e) {}
      }
    } finally {
  // always keep React state in sync
      setInput(newInput);
      // clear guard after a short delay to avoid racing with browser/IME selection updates.
      // Use two rAFs when available, and also schedule a microtask as a fallback.
      try {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            programmaticRef.current = false;
          });
        });
      } catch (e) {
        setTimeout(() => {
          programmaticRef.current = false;
        }, 0);
      }
    }
  }

  // Helper to move caret without changing value and open mention suggestions while preserving scroll
  function moveCaretAndOpenMention(caretPos: number) {
    const ta = inputRef.current;
    if (!ta) return;
    const prevScrollTop = ta.scrollTop;
    try {
      try { (ta as any).focus({ preventScroll: true }); } catch (e) { if (document.activeElement !== ta) ta.focus(); }
    } catch (e) {}
    try {
      ta.setSelectionRange(caretPos, caretPos);
    } catch (e) {}
    // restore scroll after layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try { ta.scrollTop = prevScrollTop; } catch (e) {}
        // now compute mention and open popover
        try { setMention(computeMention(ta.value, caretPos)); } catch (e) {}
      });
    });
  }

  // Stronger helper: move caret (via replaceInput) while preserving scroll and ensure scroll restored,
  // then open mention and fetch suggestions. Use this for token clicks to avoid browser auto-scroll.
  function moveCaretPreserveAndOpen(caretPos: number, newInput?: string) {
    const ta = inputRef.current;
    if (!ta) return;
    const prev = ta.scrollTop;
    // call replaceInput to set selection (preserveScroll true) and then in onDone restore scroll & open mention
    const inputToWrite = typeof newInput === 'string' ? newInput : ta.value;
    replaceInput(inputToWrite, caretPos, true, () => {
      // aggressively restore scroll - rAF x2 + microtask
      try {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try { ta.scrollTop = prev; } catch (e) {}
          });
        });
      } catch (e) {}
      // now compute mention and fetch suggestions
      try {
        const m = computeMention(inputToWrite, caretPos);
        setMention(m);
        // fetch immediately to populate suggestions so popover opens
        fetchSuggestionsNow(m.trigger, m.query || "");
      } catch (e) {}
    });
  }

  // Immediate suggestions fetch helper (bypasses debounce) used when user clicks a token
  async function fetchSuggestionsNow(trigger: Trigger | undefined, rawQuery: string, prefixText?: string) {
    try {
      if (trigger === "@") {
        const lower = rawQuery.toLowerCase();
        if (!lower) {
          setSuggestions([t('chatbot.mention.document'), t('urlContext.displayText')]);
          setActiveIdx(0);
          return;
        }
        if (lower === "문서" || lower.startsWith("문서:")) {
          let term = rawQuery.slice(2);
          if (term.startsWith(":")) term = term.slice(1);
          term = term.trim();
          const q = term ? `*${term}*` : "*";
          const r = await fetch(`/api/opensearch/indices?q=${encodeURIComponent(q)}`);
          const j = await r.json();
          const items = Array.isArray(j.indices) ? j.indices : [];
          setSuggestions(items.slice(0, 20));
          setActiveIdx(0);
          return;
        }
        // if still matching command hints
        const commands = [t('chatbot.mention.document'), t('urlContext.displayText')];
        const matchingCmds = commands.filter((c) => c.startsWith(lower));
        if (matchingCmds.length > 0) {
          setSuggestions(matchingCmds);
          setActiveIdx(0);
          return;
        }
      } else {
        // fallback: non-@ trigger, fetch indices
        const q = rawQuery || "*";
        const r = await fetch(`/api/opensearch/indices?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        const items = Array.isArray(j.indices) ? j.indices : [];
        setSuggestions(items.slice(0, 20));
        setActiveIdx(0);
      }
    } catch (err) {
      setSuggestions([]);
    }
  }

  // Sync overlay computed styles (font, padding, line-height) from textarea
  React.useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    try {
  const update = () => {
        const cs = window.getComputedStyle(ta);
        // measure single line height more reliably (handles 'normal' line-height)
        let singleLine = parseFloat((cs.lineHeight as any) || '0');
        if (!singleLine || Number.isNaN(singleLine)) {
          const meas = document.createElement('div');
          meas.style.position = 'absolute';
          meas.style.visibility = 'hidden';
          meas.style.whiteSpace = 'nowrap';
          meas.style.fontFamily = cs.fontFamily as any;
          meas.style.fontSize = cs.fontSize as any;
          meas.style.fontWeight = cs.fontWeight as any;
          meas.textContent = 'M';
          document.body.appendChild(meas);
          singleLine = meas.getBoundingClientRect().height || parseFloat(cs.fontSize as any) || 16;
          document.body.removeChild(meas);
        }
        // compute top offset of textarea relative to its offsetParent (the wrapper div)
        const rect = ta.getBoundingClientRect();
        const parentRect = (
          ta.offsetParent as HTMLElement
        )?.getBoundingClientRect?.() ?? { top: rect.top, left: rect.left };
        const topOffset = rect.top - parentRect.top;
  // compute numeric line-height and paddings to constrain textarea height
  const lineHeightPx = parseFloat(cs.lineHeight as any) || parseFloat(cs.fontSize as any) * 1.2;
  const paddingTop = parseFloat(cs.paddingTop as any) || 0;
  const paddingBottom = parseFloat(cs.paddingBottom as any) || 0;
  // reserve space for 4 lines
  inputMaxHeightRef.current = Math.round(lineHeightPx * 4 + paddingTop + paddingBottom);

        // account for scrollbar width (offsetWidth - clientWidth) so overlay text wraps the same
        const scrollbarWidth = Math.max(0, ta.offsetWidth - ta.clientWidth || 0);
  const paddingRightNum = parseFloat(cs.paddingRight as any) || 0;
  // measure send button width to avoid overlay text wrapping under the send button
  const sendBtnWidth = sendBtnRef.current ? (sendBtnRef.current.offsetWidth || 0) : 0;
  const gapRight = 12; // small gap between text and send button
  const overlayPaddingRight = paddingRightNum + scrollbarWidth + sendBtnWidth + gapRight;

        // visible height should match the textarea's visible area (capped at max 4 lines)
        const visibleHeight = Math.min(ta.scrollHeight, inputMaxHeightRef.current ?? ta.scrollHeight);

  setOverlayStyle({
          fontFamily: cs.fontFamily as any,
          fontSize: cs.fontSize as any,
          fontWeight: cs.fontWeight as any,
          lineHeight: cs.lineHeight as any,
          letterSpacing: cs.letterSpacing as any,
          textTransform: (cs.textTransform as any) || undefined,
          textAlign: (cs.textAlign as any) || undefined,
          wordSpacing: cs.wordSpacing as any,
          paddingTop: cs.paddingTop as any,
          paddingBottom: cs.paddingBottom as any,
          paddingLeft: cs.paddingLeft as any,
          paddingRight: `${overlayPaddingRight}px` as any,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          boxSizing: "border-box",
          overflowWrap: "anywhere",
          // attempt to carry over rendering hints
          textRendering: (cs.getPropertyValue?.("text-rendering") as any) || undefined,
          fontVariantLigatures: cs.fontVariantLigatures as any,
          width: "100%",
          height: `${visibleHeight}px`,
          top: `${topOffset}px`,
  } as React.CSSProperties);
  // also expose padding for textarea styling
  // overlay padding right is applied to overlayStyle directly
      };
      update();
      // observe size changes
      let ro: ResizeObserver | null = null;
      let sendRo: ResizeObserver | null = null;
      if ((window as any).ResizeObserver) {
        ro = new ResizeObserver(() => update());
        ro.observe(ta);
        // observe send button as well so overlay padding updates when its size changes
        if (sendBtnRef.current) {
          sendRo = new ResizeObserver(() => update());
          sendRo.observe(sendBtnRef.current);
        }
      }
      const onWindowResize = () => update();
      window.addEventListener('resize', onWindowResize);
      // also update on input changes (to catch line-wrap)
      const onInput = () => update();
      ta.addEventListener("input", onInput);

      // sync overlay inner transform with textarea's internal scrollTop so overlay content
      // scrolls visually in the same way as textarea content when internal scroll appears
      const onScroll = () => {
        try {
          const ov = overlayInnerRef.current;
          if (ov && ta) {
            const scrollTop = ta.scrollTop || 0;
            ov.style.transform = `translateY(${-scrollTop}px)`;
          }
        } catch (e) {}
      };
      ta.addEventListener('scroll', onScroll);

      // run once to align overlay with initial scroll
      try { onScroll(); } catch (e) {}

      return () => {
        if (ro) ro.disconnect();
        if (sendRo) sendRo.disconnect();
        window.removeEventListener('resize', onWindowResize);
        ta.removeEventListener("input", onInput);
        ta.removeEventListener('scroll', onScroll);
      };
    } catch (e) {}
  }, [fontSize, input]);

  // 현재 커서 기준 트리거 토큰 계산
  function computeMention(text: string, caret: number) {
    // NEW
    let i = caret - 1;
    while (i >= 0) {
      const ch = text[i];
      if (TRIGGERS.includes(ch as Trigger)) {
        const slice = text.slice(i + 1, caret);
        if (/\s/.test(slice)) return { open: false, query: "" };
        return { open: true, trigger: ch as Trigger, start: i, query: slice };
      }
      if (/\s/.test(ch)) break;
      i--;
    }
    return { open: false, query: "" };
  }

  // @ 버튼 클릭 시 멘션 팝오버 열기
  const handleMentionButtonClick = () => {
    // 현재 커서 위치에 @ 추가
    const current = getCurrentInput();
    const caret = inputRef.current?.selectionStart ?? current.length;
    const newInput = current.slice(0, caret) + "@" + current.slice(caret);
    replaceInput(newInput, caret + 1);
    
    // 멘션 상태 설정 (키보드 입력과 동일하게)
    setMention({ open: true, trigger: "@", start: caret, query: "" });
    setSuggestions(["문서", t('urlContext.displayText')]);
    setActiveIdx(0);
  };
  // 선택 적용 (멘션/토큰 선택 시 호출)
  function applySelection(name: string) {
    if (!inputRef.current) return;
    const current = getCurrentInput();
    const caret = inputRef.current.selectionStart ?? current.length;
    const start = mention.start ?? 0;

    // '@' 트리거 처리: 명령(문서) 혹은 값 삽입
    if (mention.trigger === "@") {
      // 링크제공 특별 처리
      if (name === t('urlContext.displayText')) {
        // 현재 URL이 있으면 URL 컨텍스트 추가
        if (typeof window !== "undefined") {
          const currentUrl = window.location.href;
          const urlObj = new URL(currentUrl);
          
          if (urlObj.pathname !== '/' && urlObj.pathname !== '/home') {
            setUrlContext({
              url: currentUrl,
              displayText: t('urlContext.displayText')
            });
          }
        }
        // @ 기호만 제거하고 멘션 팝오버 닫기
        const newInput = current.slice(0, start) + current.slice(caret);
        replaceInput(newInput, start);
        setMention({ open: false, query: "" });
        resetPaginationState();
        return;
      }
      const tokenStart = start;
      const tokenEnd = findTokenEnd(current, tokenStart);
      const tokenText = current.slice(tokenStart, tokenEnd);
      const currentQuery = (mention.query ?? "").toLowerCase();

      // top-level command 선택 (문서) -> replace token and reopen for value
      if (name === t('chatbot.mention.document')) {
        const docCommand = t('chatbot.mention.documentCommand');
        const atName = `@${docCommand}`;
        const next = current.slice(0, tokenStart) + atName + current.slice(tokenEnd);
        replaceInput(next, tokenStart + atName.length);
        setMention({ open: true, trigger: "@", start: tokenStart, query: docCommand });
        setSuggestions([]);
        setActiveIdx(0);
        return;
      }

      // If token already has a value after a colon, replace only that value when a selection is made.
      const colonIdx = tokenText.indexOf(":");
      if (colonIdx >= 0) {
        const prefixText = tokenText.slice(0, colonIdx); // e.g. '@문서'
        const newToken = prefixText + ":" + name;
        // Insert new token and preserve surrounding text
        let next = current.slice(0, tokenStart) + newToken + current.slice(tokenEnd);
        // Add trailing space to separate token from following text
        next = next.slice(0, tokenStart + newToken.length) + " " + next.slice(tokenStart + newToken.length);
        replaceInput(next, tokenStart + newToken.length + 1);
        setMention({ open: false, query: "" });
        resetPaginationState();
        return;
      }

      // If no colon present, fall back to previous insertion behavior based on query
      let atName = name.startsWith("@") ? name : `@${name}`;
      if (currentQuery.startsWith("문서")) {
        atName = name.startsWith("문서:") ? `@${name}` : `@문서:${name}`;
      }
      const tokenWithSpace = atName + " ";
      const next = current.slice(0, start) + tokenWithSpace + current.slice(caret);
      replaceInput(next, start + tokenWithSpace.length);
      setMention({ open: false, query: "" });
      resetPaginationState();
      return;
    }

    // 기타 트리거는 공백을 붙여 삽입
    const next = current.slice(0, start) + name + " " + current.slice(caret);
    replaceInput(next, start + name.length + 1);
    setMention({ open: false, query: "" });
    resetPaginationState();
  }

  // 텍스트에서 @문서 토큰을 찾아 반환
  function getTokens(text: string) {
    const re = /@문서(?::[^\s@]*)?/gi;
    const tokens: { start: number; end: number; text: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      tokens.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    }
    return tokens;
  }

  // find end index of token starting at `start` (stop at whitespace)
  function findTokenEnd(text: string, start: number) {
    let i = start;
    while (i < text.length) {
      const ch = text[i];
      if (/\s/.test(ch)) break;
      i++;
    }
    return i;
  }

  // q 변경 시 인덱스/엔드포인트 목록 가져오기 (디바운스)
  React.useEffect(() => {
    if (!mention.open) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const raw = (mention.query ?? "").trim();
      // If trigger is '@', show command hints (문서) and
      // preserve existing detailed behaviors for @문서 queries.
      let items: string[] = [];
      try {
        if (mention.trigger === "@") {
          const lower = raw.toLowerCase();
          // If user just typed '@' (empty query) show top-level commands
          if (!lower) {
            items = ["문서", t('urlContext.displayText')];
            // 페이지네이션 상태 초기화
            resetPaginationState();
          } else {
            // If user typed a prefix that matches the commands, show command hints
            const commands = [t('chatbot.mention.document'), t('urlContext.displayText')];
            const matchingCmds = commands.filter((c) => c.startsWith(lower));
            // If the user is still typing a command prefix, show those hints
            if (
              matchingCmds.length > 0 &&
              !lower.startsWith("문서:")
            ) {
              // but if the prefix fully equals a command (like '문서'), fall through to fetch behavior
              if (matchingCmds.length === 1 && matchingCmds[0] === lower) {
                // exact command typed (e.g. '@문서') -> treat as full command (no term)
                // fall through to below handlers
              } else if (
                matchingCmds.length >= 1 &&
                lower !== matchingCmds[0]
              ) {
                items = matchingCmds;
              }
            }

            // @문서 or @문서:term => use existing opensearch indices API
            if (lower === "문서" || lower.startsWith("문서:")) {
              setIsLoadingSuggestions(true);
              setLoadingMessage(t('chatbot.mention.documentLoading'));
              
              let term = raw.slice(2);
              if (term.startsWith(":")) term = term.slice(1);
              term = term.trim();
              const q = term ? `*${term}*` : "*"; // wildcard to match containing term
              const r = await fetch(
                `/api/opensearch/indices?q=${encodeURIComponent(q)}&page=1&size=${itemsPerPage}`
              );
              const j = await r.json();
              items = Array.isArray(j.indices) ? j.indices : [];
              setTotalItems(j.total || items.length);
              setTotalPages(Math.ceil((j.total || items.length) / itemsPerPage));
              setCurrentPage(1);
            }
            // If nothing matched above and we still have no items, but there are matching command hints, show them
            if (items.length === 0 && matchingCmds && matchingCmds.length > 0) {
              items = matchingCmds;
            }
          }
        } else {
          // fallback: non-@ triggers에 대한 기본 동작 없음
          items = [];
        }
      } catch (err) {
        items = [];
      } finally {
        setIsLoadingSuggestions(false);
        setLoadingMessage("");
      }
      setSuggestions(items.slice(0, 20));
      setActiveIdx(0);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mention.open, mention.query]);

  // 복사 상태
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(
    null
  );
  const [copyBusyId, setCopyBusyId] = React.useState<string | null>(null);

  const handleCopyClick = async (msg: ChatbotMessage) => {
    if (!msg?.messageId) return;
    setCopyBusyId(msg.messageId);
    // 복사 시에도 정리된 텍스트 사용
    const sanitizedMsg = sanitizeMessageContent(msg);
    const ok = await utilCopyToClipboard(extractPlainText(sanitizedMsg));
    setCopyBusyId(null);
    if (ok) {
      setCopiedMessageId(msg.messageId);
      setTimeout(() => setCopiedMessageId(null), 1500);
    } else {
      setError("클립보드 복사에 실패했습니다.");
    }
  };

  // 메시지별 trace 결과: { [interactionId]: traceData }
  const [traceMap, setTraceMap] = React.useState<Record<string, unknown>>({});
  const [traceLoadingId, setTraceLoadingId] = React.useState<string | null>(
    null
  );

  // localStorage 키 (현재 미사용)
  const CHATBOT_STORAGE_KEY = "security-copilot-messages-v1";

  // 입력창 높이에 따른 메시지 영역 하단 여백 동적 조정
  const [inputContainerHeight, setInputContainerHeight] = React.useState(0);
  const inputContainerRef = React.useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 스크롤 이동 (전송 후 + 응답 완료 후)
  React.useEffect(() => {
    if (messages.length > 0) {
      const timeout = setTimeout(() => {
        // 챗봇 컨테이너 내부에서만 스크롤하도록 제한
        const chatContainer = bottomRef.current?.closest('[data-chat-container]');
        if (chatContainer) {
          const scrollContainer = chatContainer.querySelector('[data-scroll-area]') as HTMLElement;
          if (scrollContainer) {
            // 스크롤 컨테이너가 존재하면 내부 스크롤만 사용
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          } else {
            // 스크롤 컨테이너가 없으면 안전한 스크롤 옵션 사용
            bottomRef.current?.scrollIntoView({ 
              behavior: "smooth", 
              block: "end", 
              inline: "nearest" 
            });
          }
        }
      }, 150); // 약간 더 긴 지연으로 레이아웃 안정화 대기
      return () => clearTimeout(timeout);
    }
  }, [messages, inputContainerHeight]); // inputContainerHeight 변화도 감지

  React.useEffect(() => {
    const updateHeight = () => {
      if (inputContainerRef.current) {
        const height = inputContainerRef.current.offsetHeight;
        setInputContainerHeight(height);
      }
    };

    updateHeight();
    
    // ResizeObserver로 높이 변화 감지
    const resizeObserver = new ResizeObserver(updateHeight);
    if (inputContainerRef.current) {
      resizeObserver.observe(inputContainerRef.current);
    }

    // 텍스트 영역 높이 변화도 감지
    const textareaResizeObserver = new ResizeObserver(updateHeight);
    if (inputRef.current) {
      textareaResizeObserver.observe(inputRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      textareaResizeObserver.disconnect();
    };
  }, [error, input]);

  // Event listeners for external chatbot controls are attached below (after fetchConversations
  // is declared) to avoid temporal-dead-zone issues.
  const [historyList, setHistoryList] = React.useState<ConversationSummary[]>(
    []
  );
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [historyTotal, setHistoryTotal] = React.useState(0);
  const pageSizeOptions = [10, 20, 50, 100];
  const [historyPageSize, setHistoryPageSize] = React.useState(20);
  const historyListRef = React.useRef<HTMLDivElement>(null);

  // 과거 대화방 목록 불러오기
  // 페이지네이션용 fetch
const fetchConversations = useCallback(
  async (page = 1, pageSize = historyPageSize) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/opensearch-dashboards/assistant/conversations?page=${page}&perPage=${pageSize}&fields=createdTimeMs&fields=updatedTimeMs&fields=title&sortField=updatedTimeMs&sortOrder=DESC&searchFields=title`
      );
      const data = await res.json();
      setHistoryList(data.objects || []);
      setHistoryTotal(data.total || 0);
    } catch {
      setHistoryList([]);
      setHistoryTotal(0);
    } finally {
      setHistoryLoading(false);
    }
  },
  [historyPageSize]
);

  const handleConversationSelect = React.useCallback(
    async (conversation: ConversationSummary) => {
      try {
        const res = await fetch(
          `/api/opensearch-dashboards/assistant/conversation/${conversation.id}`
        );
        const data = await res.json();
        const conversationMessages: ChatbotMessage[] = Array.isArray(data.messages)
          ? data.messages
          : [];
        const sanitizedMessages = conversationMessages.map((message, index) => {
          // 마크다운 문법이 있으면 contentType을 markdown으로 설정
          const shouldBeMarkdown = hasMarkdownSyntax(message.content || '');
          const messageWithContentType = {
            ...message,
            contentType: shouldBeMarkdown ? 'markdown' : (message.contentType || 'text'),
          };

          const sanitized = sanitizeMessageContent(messageWithContentType);
          
          // content에서 action_result_data 주석 파싱 (OpenSearch에 저장된 경우)
          if (sanitized.content && typeof sanitized.content === 'string') {
            const actionResultMatch = sanitized.content.match(/<!-- action_result_data: ({.*?}) -->/);
            if (actionResultMatch && !sanitized.actionResult) {
              try {
                const actionData = JSON.parse(actionResultMatch[1]);
                // actionResult 정보 복원
                if (actionData.result) {
                  sanitized.actionResult = actionData.result;
                }
                // proposedAction 정보 복원
                if (actionData.action) {
                  sanitized.proposedAction = {
                    action: actionData.action,
                    params: actionData.params || {},
                    description: actionData.result?.description || ''
                  };
                }
              } catch (e) {
                console.warn('action_result_data 파싱 실패:', e);
              }
            }
          }
          
          if (!sanitized.createdAt) {
            const baseTime = new Date(conversation.updatedTimeMs);
            const messageTime = new Date(
              baseTime.getTime() - (conversationMessages.length - index) * 60000
            );
            sanitized.createdAt = messageTime.toISOString();
          }
          return sanitized;
        });
        setMessages(sanitizedMessages);
        setConversationId(conversation.id);
        setUrlContext(null);
        setShowHistory(false);
      } catch (error) {
        console.error("Failed to open conversation", error);
        setError(t("historyOpenError"));
      }
    },
    [t, setError, setUrlContext]
  );

  const handleHistoryPageSizeChange = React.useCallback(
    (size: number) => {
      const nextSize = size || 20;
      setHistoryPageSize(nextSize);
      setHistoryPage(1);
      fetchConversations(1, nextSize).catch(() => {});
    },
    [fetchConversations]
  );

  const handleHistoryPageChange = React.useCallback(
    (pageZeroBased: number) => {
      const pageOneBased = pageZeroBased + 1;
      setHistoryPage(pageOneBased);
      fetchConversations(pageOneBased, historyPageSize).catch(() => {});
      try {
        historyListRef.current?.scrollTo?.(0, 0);
      } catch (error) {
        console.warn("Failed to scroll history list", error);
      }
    },
    [fetchConversations, historyPageSize]
  );

  const handleEditConversationClick = React.useCallback((conversation: ConversationSummary) => {
    setEditError(null);
    setEditModal({ open: true, id: conversation.id, title: conversation.title || "" });
  }, []);

  const handleDeleteConversationClick = React.useCallback((conversation: ConversationSummary) => {
    setDeleteError(null);
    setDeleteModal({ open: true, id: conversation.id, title: conversation.title || "" });
  }, []);

  const handleEditModalChange = React.useCallback((title: string) => {
    setEditModal((prev) => ({ ...prev, title }));
  }, []);

  const handleEditModalClose = React.useCallback(() => {
    if (editSaving) return;
    setEditModal({ open: false, title: "" });
  }, [editSaving]);

  const handleEditSubmit = React.useCallback(async () => {
    if (!editModal.id) return;
    setEditError(null);
    setEditSaving(true);
    try {
      const requestBody = { title: editModal.title.trim() };
      const res = await fetch(
        `/api/opensearch-dashboards/assistant/conversation/${editModal.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );
      if (!res.ok) {
        let text = "";
        try {
          text = await res.text();
        } catch (error) {}
        throw new Error(text || `HTTP ${res.status}`);
      }
      await res.json();
      setHistoryList((list) =>
        list.map((item) =>
          item.id === editModal.id
            ? { ...item, title: editModal.title.trim(), updatedTimeMs: Date.now() }
            : item
        )
      );
      setEditModal({ open: false, title: "" });
    } catch (error) {
      console.error("Failed to save conversation title", error);
      setEditError(
        t("saveFailed", { default: "저장에 실패했습니다." }) +
          (error instanceof Error && error.message ? `: ${error.message}` : "")
      );
    } finally {
      setEditSaving(false);
    }
  }, [editModal, t]);

  const handleDeleteModalClose = React.useCallback(() => {
    if (deleteLoading) return;
    setDeleteModal({ open: false, title: "" });
  }, [deleteLoading]);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteModal.id) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/opensearch-dashboards/assistant/conversation/${deleteModal.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        let text = "";
        try {
          text = await res.text();
        } catch (error) {}
        throw new Error(text || `HTTP ${res.status}`);
      }
      setHistoryList((list) => list.filter((item) => item.id !== deleteModal.id));
      setDeleteModal({ open: false, title: "" });
      if (conversationId === deleteModal.id) {
        setMessages([]);
        setConversationId(undefined);
        setTraceMap({});
        setTraceOpenMap({});
        setOpenStepMap({});
        setInput("");
      }
    } catch (error) {
      console.error("Failed to delete conversation", error);
      setDeleteError(
        t("deleteFailed", { default: "삭제에 실패했습니다." }) +
          (error instanceof Error && error.message ? `: ${error.message}` : "")
      );
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteModal, t, conversationId]);

  // Attach external event listeners here to ensure fetchConversations is already defined.
  React.useEffect(() => {
    const onNewChat = () => {
      // 새 채팅 시 메시지를 완전히 비워서 환영 메시지가 표시되도록 함
      setMessages([]);
      setConversationId(undefined);
      setTraceMap({});
      setTraceOpenMap({});
      setOpenStepMap({});
      setError("");
      setInput(""); // 입력창도 초기화
      setUrlContext(null); // URL 컨텍스트도 초기화하여 @링크제공이 꺼진 상태로 시작
      // 환영 메시지 애니메이션 트리거
      setShowWelcomeAnimation(true);
      // 애니메이션 완료 후 상태 리셋
      setTimeout(() => setShowWelcomeAnimation(false), 600);
    };

    const onToggleHistory = () => {
      setShowHistory((prev) => {
        const next = !prev;
        if (next) {
          setHistoryPage(1);
          // fire-and-forget fetch
          fetchConversations(1).catch(() => {});
        }
        return next;
      });
    };

    const onToggleSettings = () => setShowSettingsPanel((v) => !v);

    const onSaveState = () => {
      // 언어 변경 시 현재 상태를 즉시 저장 (디바운싱 없이)
      saveChatbotState();
    };

    window.addEventListener("chatbot:newChat", onNewChat as EventListener);
    window.addEventListener("chatbot:toggleHistory", onToggleHistory as EventListener);
    window.addEventListener("chatbot:toggleSettings", onToggleSettings as EventListener);
    window.addEventListener("chatbot:saveState", onSaveState as EventListener);
    return () => {
      window.removeEventListener("chatbot:newChat", onNewChat as EventListener);
      window.removeEventListener("chatbot:toggleHistory", onToggleHistory as EventListener);
      window.removeEventListener("chatbot:toggleSettings", onToggleSettings as EventListener);
      window.removeEventListener("chatbot:saveState", onSaveState as EventListener);
    };
  }, [fetchConversations, t, saveChatbotState]);
  
  // 컴포넌트 언마운트 시 폴링 정리
  React.useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // 외부 클릭 감지로 히스토리와 설정 패널 닫기 (전체 화면에서 동작)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // 멘션 팝오버가 열려있는 경우
      if (mention.open && suggestions.length > 0) {
        const mentionPopover = document.querySelector('[data-mention-popover]');
        const mentionButton = target.closest('button[aria-label*="멘션"]') || 
                              target.closest('button[aria-label*="Mention"]');
        
        // 페이지네이션 버튼인지 확인 (여러 방법으로 체크)
        const isPaginationButton = 
          target.closest('.pagination-btn') ||
          target.closest('[data-pagination-button]') ||
          target.hasAttribute('data-pagination-button') ||
          (target.tagName === 'BUTTON' && (
            target.textContent?.trim() === '이전' || 
            target.textContent?.trim() === '다음'
          ));
        
        // MentionPopover 내부의 모든 클릭을 허용
        // contains로 체크하면 버튼이 팝오버 내부에 있는지 확인 가능
        const isInsideMentionPopover = mentionPopover && mentionPopover.contains(target);
        
        // 페이지네이션 버튼이거나 팝오버 내부 클릭이면 무시
        if (isPaginationButton || isInsideMentionPopover || mentionButton) {
          return; // 아무것도 하지 않음
        }
        
        // 팝오버 외부 클릭일 때만 닫기
        if (mentionPopover) {
          setMention({ open: false, query: "" });
          setSuggestions([]);
          resetPaginationState();
        }
      }
      
      // 히스토리 패널이 열려있는 경우
      if (showHistory && historyListRef.current) {
        // 히스토리 패널 내부 클릭이 아니고, 히스토리 버튼 클릭도 아닌 경우
        const isInsideHistoryPanel = historyListRef.current.contains(target);
        const isHistoryButton = target.closest('button[aria-label="과거 채팅"]') || 
                                target.closest('button[title="과거 채팅"]');
        
        if (!isInsideHistoryPanel && !isHistoryButton) {
          setShowHistory(false);
        }
      }
      // 설정 패널이 열려있는 경우
      if (showSettingsPanel) {
        const settingsPanel = document.querySelector('[data-settings-panel]');
        if (settingsPanel) {
          // 설정 패널 내부 클릭이 아니고, 설정 버튼 클릭도 아닌 경우
          const isInsideSettingsPanel = settingsPanel.contains(target);
          const isSettingsButton = target.closest('button[aria-label="설정"]') || 
                                   target.closest('button[title="설정"]') ||
                                   target.closest('[data-settings-button]');
          
          if (!isInsideSettingsPanel && !isSettingsButton) {
            setShowSettingsPanel(false);
          }
        }
      }
    };

    if (showHistory || showSettingsPanel || (mention.open && suggestions.length > 0)) {
      // 전체 문서에 이벤트 리스너 추가
      // 팝오버 내부의 모든 클릭은 stopPropagation으로 차단되므로 이벤트가 전파되지 않음
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showHistory, showSettingsPanel, mention.open, suggestions.length]);

  // 마우스 위치 기반 스크롤 영역 분리 로직
  React.useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement;
      
      // 히스토리 패널이 열려있는 경우
      if (showHistory) {
        const historyPanel = target.closest('[data-history-panel]');
        if (historyPanel) {
          // 히스토리 패널 내부에서는 정상 스크롤 동작
          return;
        }
        // 히스토리 패널 외부에서는 다른 영역의 스크롤 처리
        const chatContainer = target.closest('[data-chat-container]');
        if (chatContainer) {
          // 채팅 컨테이너 내부에서 스크롤 이벤트 발생
          const scrollContainer = chatContainer.querySelector('[data-scroll-area]') as HTMLElement;
          
          if (scrollContainer) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
            
            // 위로 스크롤하려고 하는데 이미 맨 위에 있거나, 아래로 스크롤하려고 하는데 이미 맨 아래에 있으면
            // 페이지 스크롤로 전달 (단, 챗봇이 막 열린 경우는 제외)
            if ((event.deltaY < 0 && isAtTop) || (event.deltaY > 0 && isAtBottom)) {
              event.preventDefault();
              // 챗봇이 막 열린 경우가 아니면 페이지 스크롤로 전달
              const now = Date.now();
              const lastOpenTime = (window as any).__chatbotLastOpenTime || 0;
              if (now - lastOpenTime > 1000) { // 1초 후에만 페이지 스크롤 허용
                window.scrollBy(0, event.deltaY);
              }
            }
          }
        } else {
          // 채팅 컨테이너 외부에서는 페이지 스크롤 허용
          // 기본 동작 유지
        }
        return;
      }
      
      // 설정 패널이 열려있는 경우
      if (showSettingsPanel) {
        const settingsPanel = target.closest('[data-settings-panel]');
        if (settingsPanel) {
          // 설정 패널 내부에서는 정상 스크롤 동작
          return;
        }
        // 설정 패널 외부에서는 다른 영역의 스크롤 처리
        const chatContainer = target.closest('[data-chat-container]');
        if (chatContainer) {
          // 채팅 컨테이너 내부에서 스크롤 이벤트 발생
          const scrollContainer = chatContainer.querySelector('[data-scroll-area]') as HTMLElement;
          
          if (scrollContainer) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
            
            // 위로 스크롤하려고 하는데 이미 맨 위에 있거나, 아래로 스크롤하려고 하는데 이미 맨 아래에 있으면
            // 페이지 스크롤로 전달
            if ((event.deltaY < 0 && isAtTop) || (event.deltaY > 0 && isAtBottom)) {
              event.preventDefault();
              // 페이지 스크롤로 전달
              window.scrollBy(0, event.deltaY);
            }
          }
        } else {
          // 채팅 컨테이너 외부에서는 페이지 스크롤 허용
          // 기본 동작 유지
        }
        return;
      }
      
      // 패널이 열려있지 않은 일반적인 경우
      const chatContainer = target.closest('[data-chat-container]');
      
      if (chatContainer) {
        // 채팅 컨테이너 내부에서 스크롤 이벤트 발생
        const scrollContainer = chatContainer.querySelector('[data-scroll-area]') as HTMLElement;
        
        if (scrollContainer) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
          const isAtTop = scrollTop === 0;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
          
          // 위로 스크롤하려고 하는데 이미 맨 위에 있거나, 아래로 스크롤하려고 하는데 이미 맨 아래에 있으면
          // 페이지 스크롤로 전달
          if ((event.deltaY < 0 && isAtTop) || (event.deltaY > 0 && isAtBottom)) {
            event.preventDefault();
            // 페이지 스크롤로 전달
            window.scrollBy(0, event.deltaY);
          }
        }
      }
      // 채팅 컨테이너 외부에서는 기본 페이지 스크롤 동작 유지
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [showHistory, showSettingsPanel]);

  const handleSend = async (inputText?: string) => {
    const sendText = inputText ?? input;
    if (!sendText.trim()) return;
    setLoading(true);
    setError("");

    const now = new Date();
    
    // URL 컨텍스트가 있으면 메시지 앞에 추가
    let finalContent = sendText;
    if (urlContext) {
      finalContent = `현재 사용자는 ${urlContext.url}에서 질문하고 있음을 고려해서 답변해주세요\n\nUser: ${sendText}`;
    }
    
    const userMsg: ChatbotMessage = {
      messageId: uuidv4(),
      type: "input",
      content: finalContent,
      contentType: "markdown", // 사용자 메시지도 마크다운으로 렌더링
      createdAt: now.toISOString(),
    };

    // Optimistic: 사용자 메시지 즉시 추가 (원본 텍스트로 표시)
    const displayMsg: ChatbotMessage = {
      ...userMsg,
      content: sendText, // 표시용으로는 원본 텍스트 사용
    };
    setMessages((prev) => [...prev, displayMsg]);

    // Immediately clear the input so the user's draft disappears on send
    try {
      replaceInput("", 0);
    } catch (e) {}

    const req: ChatbotRequest = {
      messages: [...messages, displayMsg],
      input: {
        type: "input",
        content: finalContent, // 실제 전송은 URL 컨텍스트 포함
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
      console.log("Chatbot response:", res);
      currentConversationId = res?.conversationId;
      
      if (currentConversationId) {
        setConversationId(currentConversationId);
      }
      
      const assistantMessages = (res?.messages ?? []).filter((m) => m.type !== "input");
      if (!assistantMessages.length && currentConversationId) {
        // 서버가 처리했지만 응답이 비어있을 경우 폴링 시작
        console.log("Empty response, starting polling for conversation:", currentConversationId);
        
        const pollForMessages = async () => {
          try {
            const res = await fetch(`/api/opensearch-dashboards/assistant/conversation/${currentConversationId}`);
            if (!res.ok) return;
            
            const data = await res.json();
            if (data?.messages && Array.isArray(data.messages)) {
              const newAssistantMessages = data.messages.filter((m: ChatbotMessage) => m.type !== "input");
              if (newAssistantMessages.length > 0) {
                console.log("Polling found messages:", newAssistantMessages);
                stopPolling();
                setMessages((prev) => {
                  // 이미 있는 메시지인지 확인
                  const existingIds = new Set(prev.map(m => m.messageId));
                  const uniqueMessages = newAssistantMessages.filter((m: ChatbotMessage) => !existingIds.has(m.messageId));
                  if (uniqueMessages.length > 0) {
                    return [
                      ...prev,
                      ...uniqueMessages.map((m: ChatbotMessage) => {
                        console.log("Processing message:", m.messageId, "interactionId:", m.interactionId);
                        // 마크다운 문법이 있으면 contentType을 markdown으로 설정
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
        
        // 즉시 한 번 체크
        pollForMessages();
        // 그 다음 2초마다 체크 (최대 120초 = 2분)
        let pollCount = 0;
        const MAX_POLL_COUNT = 60; // 60회 × 2초 = 120초 (2분)
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
        // 메시지가 있으면 정상 처리
        setMessages((prev) => [
          ...prev,
          ...assistantMessages.map((m) => {
            console.log("Processing message:", m.messageId, "interactionId:", m.interactionId);
            // 마크다운 문법이 있으면 contentType을 markdown으로 설정
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
        // 응답도 없고 conversationId도 없는 경우 에러
        setError(t("error"));
      }
      // Do not clear the input here; preserve any draft the user typed while waiting.
    } catch (e) {
      setError(t("error"));
      stopPolling();
      // 이미 optimistic으로 추가됨
    } finally {
      // Ensure textarea is active after send completes; keep send button disabled until input non-empty
      setLoading(false);
      // 폴링은 백그라운드에서 계속되므로 여기서 stop하지 않음
      try {
        // Preserve any draft typed during loading; just focus the textarea.
        requestAnimationFrame(() => {
          try { inputRef.current?.focus({ preventScroll: true }); } catch (e) {}
        });
      } catch (e) {}
    }
  };

  // 추가: 리사이저 토글 상태 및 핸들러
  const [collapsed, setCollapsed] = React.useState(false);
  const prevWidthRef = React.useRef<number | null>(null);

  const toggleCollapse = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCollapsed((c) => {
      const next = !c;
      if (next) {
        // store current width and collapse
        prevWidthRef.current = assistantWidth;
        setAssistantWidth(48);
      } else {
        // restore
        const restore = prevWidthRef.current || 400;
        setAssistantWidth(restore);
      }
      return next;
    });
  };

  // 액션 승인 후 실행 및 결과를 Agent에 피드백
  const handleActionApproved = React.useCallback(async (
    messageId: string,
    proposedAction: ProposedAction,
    result: ActionResult
  ) => {
    console.log('handleActionApproved 호출:', { messageId, result });
    
    // 메시지에 결과 추가
    setMessages((prev) => {
      const updated = prev.map((msg) => {
        if (msg.messageId === messageId) {
          const updatedMsg = { 
            ...msg, 
            actionResult: result,
            proposedAction: msg.proposedAction || proposedAction
          };
          console.log('메시지 업데이트:', updatedMsg.messageId, 'actionResult:', updatedMsg.actionResult);
          return updatedMsg;
        }
        return msg;
      });
      console.log('업데이트된 메시지 개수:', updated.length);
      return updated;
    });

    // 액션 실행 결과를 OpenSearch Assistant에 메시지로 전송하여 대화 내역에 저장
    if (conversationId && result) {
      try {
        // 결과를 마크다운 형식으로 포맷팅
        const resultOutput = result.output 
          ? `\`\`\`\n${result.output.trim()}\n\`\`\`` 
          : '';
        const resultError = result.error 
          ? `\n\n**오류:**\n\`\`\`\n${result.error}\n\`\`\`` 
          : '';
        const simulationNote = result.simulation 
          ? '\n\n⚠️ *시뮬레이션 모드로 실행되었습니다.*' 
          : '';
        const auditInfo = result.auditId 
          ? `\n\n**감사 ID:** \`${result.auditId}\`` 
          : '';

        // 결과를 마크다운 형식으로 포맷팅하여 메시지에 포함
        // 이렇게 하면 OpenSearch에 저장될 때 actionResult 정보가 content에 포함됨
        const feedbackMessage = `## ✅ 액션 실행 결과: ${proposedAction.description}

**상태:** ${result.success ? '✅ 성공' : '❌ 실패'}${auditInfo}

${result.command ? `**실행된 명령어:**\n\`\`\`\n${result.command}\n\`\`\`\n\n` : ''}${resultOutput}${resultError}${simulationNote}

<!-- action_result_data: ${JSON.stringify({ 
  action: proposedAction.action, 
  params: proposedAction.params,
  result: {
    success: result.success,
    command: result.command,
    output: result.output?.substring(0, 500), // 긴 출력은 일부만 저장
    error: result.error,
    auditId: result.auditId,
    simulation: result.simulation,
    timestamp: result.timestamp
  }
})} -->`;

        // 현재 메시지들에 actionResult를 포함하여 전송
        // 이렇게 하면 OpenSearch가 메시지를 저장할 때 구조화된 정보도 함께 저장될 수 있음
        const messagesWithActionResult = messages.map((msg) => {
          if (msg.messageId === messageId && !msg.actionResult) {
            return {
              ...msg,
              actionResult: result,
              proposedAction: proposedAction
            };
          }
          return msg;
        });

        // OpenSearch Assistant에 메시지로 전송하여 대화 내역에 저장
        const feedbackReq: ChatbotRequest = {
          messages: messagesWithActionResult, // actionResult가 포함된 메시지들
          input: {
            type: 'input',
            content: feedbackMessage,
            contentType: 'text',
            context: { appId: 'home' },
          },
          conversationId: conversationId,
        };

        console.log('액션 결과를 Assistant에 전송 중...', { conversationId });
        
        const feedbackRes = await sendChatbotMessage(feedbackReq);
        console.log('액션 결과 전송 완료:', feedbackRes);

        // 응답된 메시지를 UI에 추가
        if (feedbackRes?.messages && feedbackRes.messages.length > 0) {
          const assistantFeedbackMsgs = feedbackRes.messages
            .filter((m: ChatbotMessage) => m.type === 'output')
            .map((m: ChatbotMessage) => {
              // 마크다운 문법이 있으면 contentType을 markdown으로 설정
              const shouldBeMarkdown = hasMarkdownSyntax(m.content || '');
              return {
                ...m,
                contentType: shouldBeMarkdown ? 'markdown' : (m.contentType || 'text'),
                createdAt: m.createdAt || new Date().toISOString(),
              };
            });

          if (assistantFeedbackMsgs.length > 0) {
            setMessages((prev) => {
              console.log('Assistant 응답 메시지 추가:', assistantFeedbackMsgs.length);
              return [...prev, ...assistantFeedbackMsgs];
            });
          }
        }
          } catch (error) {
        console.error('액션 결과를 Assistant에 전송 실패:', error);
        // 실패해도 로컬 메시지는 유지 (에러 표시용)
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        const errorMsg: ChatbotMessage = {
          messageId: uuidv4(),
          type: 'output',
          contentType: 'text',
          content: `⚠️ 액션 실행 결과를 대화 내역에 저장하지 못했습니다: ${errorMessage}`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    }
  }, [conversationId, messages]);

  // helper: render chat panel inline or into sidecar portal when docked
  function renderChatPanel(inner: React.ReactNode) {
    if (!docked) return inner;        // inline when not docked
    if (!sidecarEl) return null;      // wait for portal host
    // Sidecar wrapper with resizer button on the left edge. Width is adjustable.
    return createPortal(
      <div
        className="chatbot-sidecar relative"
        data-state={sidecarState}
        ref={sidecarRef}
        style={{ width: `${assistantWidth}px` }}
      >
        {/* centralized resizer component */}
        <AssistantResizer containerRef={sidecarRef} />

        <div style={{ height: '100%', overflow: 'hidden' }}>
          {inner}
        </div>
      </div>,
      sidecarEl
    );
  }

  // =====================
  // trace 핸들러 (분기 사용보다 위에 둠)
  // =====================
  const handleTrace = React.useCallback(async (interactionId: string): Promise<any[] | null> => {
    if (!interactionId) {
      console.warn("handleTrace: No interactionId provided");
      return null;
    }
    setTraceLoadingId(interactionId);
    setError("");
    try {
      console.log(`Fetching trace for interactionId: ${interactionId}`);
      const res = await fetch(`/api/opensearch-dashboards/assistant/trace/${interactionId}`);
      
      if (!res.ok) {
        console.error(`Trace API failed with status: ${res.status}`);
        setError(`트레이스 요청 실패 (${res.status})`);
        setTraceLoadingId(null);
        return null;
      }
      
      const data = await res.json();
      console.log("Trace data received:", data);
      
      // trace 데이터를 설정하고 동시에 반환
      setTraceMap((prev) => ({ ...prev, [interactionId]: data }));
      setTraceLoadingId(null);
      return data;
    } catch (e) {
      console.error("Trace request error:", e);
      setError(`트레이스 요청 실패: ${e instanceof Error ? e.message : String(e)}`);
      setTraceLoadingId(null);
      return null;
    }
  }, []);

  const handleTraceToggle = React.useCallback(
    async (interactionId: string) => {
      if (!interactionId) return;
      
      // 이미 trace 데이터가 있으면 토글만
      if (traceMap[interactionId]) {
        setTraceOpenMap((prev) => ({
          ...prev,
          [interactionId]: !prev[interactionId],
        }));
        return;
      }
      
      // trace 데이터가 없으면 로드하고, 성공하면 열기
      const traceData = await handleTrace(interactionId);
      if (traceData && Array.isArray(traceData) && traceData.length > 0) {
        // trace 데이터가 성공적으로 로드되었고 유효한 경우에만 열기
        // traceMap은 이미 handleTrace에서 업데이트되었으므로 바로 traceOpenMap 업데이트
        setTraceOpenMap((prev) => ({
          ...prev,
          [interactionId]: true,
        }));
      }
    },
    [traceMap, handleTrace]
  );

  const handleTraceStepToggle = React.useCallback((interactionId: string, stepIndex: number) => {
    setOpenStepMap((prev) => {
      const current = prev[interactionId] ?? [];
      const exists = current.includes(stepIndex);
      return {
        ...prev,
        [interactionId]: exists
          ? current.filter((value) => value !== stepIndex)
          : [...current, stepIndex],
      };
    });
  }, []);

  // =====================
  // scrollAreaOnly 전용 뷰
  // =====================
  if (scrollAreaOnly) {
    return (
      <ChatbotScrollAreaView
        messages={messages}
        isInitialized={isInitialized}
        loading={loading}
        copiedMessageId={copiedMessageId}
        copyBusyId={copyBusyId}
        bottomRef={bottomRef}
        sanitizeMessageContent={sanitizeMessageContent}
        onTrace={handleTraceToggle}
        onCopy={handleCopyClick}
        t={t}
        onActionApproved={handleActionApproved}
      />
    );
  }
  return renderChatPanel(
    <div
      data-chat-container
      className={`flex flex-col h-full min-h-0 w-full relative overflow-hidden transition-all duration-300 ${fontSize}`}
      style={{ opacity, background: '#141926', border: 'none' }}
    >
      {showSettingsPanel && (
        <SettingsPanel
          t={t}
          panelWidth={computedPanelWidth}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          opacity={opacity}
          onOpacityChange={setOpacity}
          onMouseDown={(event) => event.stopPropagation()}
        />
      )}

      {showHistory && (
        <HistoryPanel
          t={t}
          panelWidth={computedPanelWidth}
          containerRef={historyListRef}
          total={historyTotal}
          page={historyPage}
          pageSize={historyPageSize}
          pageSizeOptions={pageSizeOptions}
          loading={historyLoading}
          conversations={historyList}
          onSelectConversation={handleConversationSelect}
          onEditConversation={handleEditConversationClick}
          onDeleteConversation={handleDeleteConversationClick}
          onChangePageSize={handleHistoryPageSizeChange}
          onPageChange={handleHistoryPageChange}
          editModal={editModal}
          onEditModalClose={handleEditModalClose}
          onEditModalChange={handleEditModalChange}
          onEditSubmit={handleEditSubmit}
          editSaving={editSaving}
          editError={editError}
          deleteModal={deleteModal}
          onDeleteModalClose={handleDeleteModalClose}
          onDeleteConfirm={handleDeleteConfirm}
          deleteLoading={deleteLoading}
          deleteError={deleteError}
        />
      )}

      <MessageList
        t={t}
        messages={messages}
        isInitialized={isInitialized}
        showWelcomeAnimation={showWelcomeAnimation}
        panelWidth={computedPanelWidth}
        bubbleMaxPercent={messageBubbleMaxPercent}
        inputContainerHeight={inputContainerHeight}
        sanitizeMessageContent={sanitizeMessageContent}
        hasUrlContext={hasUrlContext}
        extractUserMessage={extractUserMessage}
        traceMap={traceMap}
        traceOpenMap={traceOpenMap}
        openStepMap={openStepMap}
        onToggleTrace={handleTraceToggle}
        onToggleTraceStep={handleTraceStepToggle}
        traceLoadingId={traceLoadingId}
        onCopyMessage={handleCopyClick}
        copyBusyId={copyBusyId}
        copiedMessageId={copiedMessageId}
        loading={loading}
        bottomRef={bottomRef}
        onActionApproved={handleActionApproved}
      />

      <div
        ref={inputContainerRef}
        className={`absolute bottom-0 left-0 right-0 ${error ? 'pt-12 pb-6 pl-6 pr-6' : 'p-4 md:p-6'} safe-bottom`}
        style={{
          background: 'rgba(20, 24, 38, 0.95)',
          borderTop: '1px solid rgba(88, 46, 242, 0.3)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {error && (
          <div
            className="absolute top-2 left-6 right-6 text-red-400 text-sm p-2 rounded border border-red-500/30"
            style={{ background: 'rgba(239, 68, 68, 0.2)' }}
          >
            {error}
          </div>
        )}

        <div
          className="relative dashboard-glass-card rounded-2xl md:rounded-3xl p-2 md:p-2.5 shadow-sm group transition-all duration-300"
          style={{
            background: 'rgba(88, 46, 242, 0.2)',
            border: '1px solid rgba(88, 46, 242, 0.4)'
          }}
        >
          <div className="flex items-center gap-1.5 md:gap-1 mb-2">
            <button
              type="button"
              onClick={handleMentionButtonClick}
              className="flex items-center justify-center px-3 py-2 md:px-2 md:py-1 rounded-xl transition-colors duration-200 shadow-sm flex-shrink-0 text-white hover:text-[#29F280] min-h-[44px] md:min-h-0"
              aria-label={t('mentionButton.ariaLabel')}
              style={{
                background: 'rgba(88, 46, 242, 0.2)',
                border: '1px solid rgba(88, 46, 242, 0.3)'
              }}
            >
              <span className="text-sm md:text-xs font-medium">@</span>
            </button>

            {urlContext && (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-xl w-fit text-white"
                style={{
                  background: 'rgba(88, 46, 242, 0.2)',
                  border: '1px solid rgba(88, 46, 242, 0.3)'
                }}
              >
                <span className="text-xs font-medium">@{urlContext.displayText}</span>
                <button
                  type="button"
                  onClick={() => setUrlContext(null)}
                  className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-[rgba(88,46,242,0.3)] transition-colors duration-150"
                  aria-label={t('urlContext.removeLabel')}
                >
                  <IconClose width={10} height={10} className="text-white" />
                </button>
              </div>
            )}
          </div>

          <div className="relative flex items-center min-h-14 px-2 md:px-1.5">
            <div className="flex-1 overflow-hidden">
              <textarea
                id="chatbot-input"
                name="chatbotInput"
                aria-label={t('inputPlaceholder')}
                ref={inputRef}
                className={`w-full px-3 py-2.5 md:py-2 min-w-0 border-0 resize-none focus:outline-none bg-transparent ${fontSize} text-white max-h-64 overflow-auto`}
                placeholder={t('inputPlaceholder')}
                defaultValue={input}
                onInput={(event) => {
                  try {
                    if (programmaticRef.current) return;
                    const value = (event.currentTarget as HTMLTextAreaElement).value;
                    setInput(value);
                    try {
                      const textarea = inputRef.current;
                      if (textarea) {
                        textarea.style.height = 'auto';
                        const maxHeight = inputMaxHeightRef.current ?? Infinity;
                        const desired = Math.min(textarea.scrollHeight, maxHeight);
                        textarea.style.height = `${desired}px`;
                        if (textarea.scrollHeight > maxHeight) {
                          textarea.style.overflow = 'auto';
                          textarea.scrollTop = textarea.scrollHeight;
                        } else {
                          textarea.style.overflow = 'hidden';
                        }
                      }
                    } catch {}
                    const caret = (event.currentTarget as HTMLTextAreaElement).selectionStart ?? value.length;
                    setMention(computeMention(value, caret));
                  } catch {}
                }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(event) => {
                  setIsComposing(false);
                  try {
                    const value = (event.currentTarget as HTMLTextAreaElement).value;
                    const caret = (event.currentTarget as HTMLTextAreaElement).selectionStart ?? value.length;
                    setMention(computeMention(value, caret));
                  } catch {}
                }}
                onKeyDown={(event) => {
                  if (mention.open) {
                    if (event.key === 'ArrowLeft') {
                      event.preventDefault();
                      if (totalPages > 1 && currentPage > 1) {
                        handlePageChange(currentPage - 1);
                      }
                      return;
                    }
                    if (event.key === 'ArrowRight') {
                      event.preventDefault();
                      if (totalPages > 1 && currentPage < totalPages) {
                        handlePageChange(currentPage + 1);
                      }
                      return;
                    }
                    if (suggestions.length > 0) {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setActiveIdx((index) => (index + 1) % suggestions.length);
                        return;
                      }
                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setActiveIdx((index) => (index - 1 + suggestions.length) % suggestions.length);
                        return;
                      }
                      if (event.key === 'Enter' || event.key === 'Tab') {
                        event.preventDefault();
                        applySelection(suggestions[activeIdx]);
                        return;
                      }
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setMention({ open: false, query: '' });
                      setSuggestions([]);
                      resetPaginationState();
                      return;
                    }
                  }
                  if (event.key === 'Enter' && !loading && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                style={{
                  color: '#ffffff',
                  textFillColor: '#ffffff',
                  WebkitTextFillColor: '#ffffff',
                  caretColor: 'black',
                  background: 'transparent',
                  resize: 'none',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  width: '100%',
                  position: 'relative',
                  zIndex: 10,
                } as React.CSSProperties}
              />
            </div>

            <div className="flex items-center ml-2">
              <button
                ref={sendBtnRef}
                className={`bg-[#1CCA5D] hover:bg-[#16A34A] text-white w-10 h-10 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0`}
                onClick={() => handleSend(input)}
                disabled={loading || !input.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <MentionPopover
          open={mention.open}
          items={suggestions}
          activeIndex={activeIdx}
          onClickItem={applySelection}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          isLoading={isLoadingSuggestions}
          loadingMessage={loadingMessage}
        />
      </div>
    </div>
  );
}
