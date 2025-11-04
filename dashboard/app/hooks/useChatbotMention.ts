/**
 * 챗봇 멘션 기능을 위한 커스텀 훅
 * 
 * @문서, @링크제공 등의 멘션 기능을 관리합니다.
 */

import { useState, useRef, useCallback } from 'react';

const TRIGGERS = ["/", "#", "@"] as const;
type Trigger = (typeof TRIGGERS)[number];

export type MentionState = {
  open: boolean;
  trigger?: Trigger;
  start?: number;
  query: string;
};

/**
 * 멘션 팝오버 상태 및 제어 훅
 */
export function useChatbotMention(t: (key: string) => string) {
  const [mention, setMention] = useState<MentionState>({ open: false, query: "" });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 텍스트에서 멘션 정보를 계산합니다.
   * 
   * @param text - 입력 텍스트
   * @param caretPos - 커서 위치
   * @returns 멘션 상태
   */
  const computeMention = useCallback((text: string, caretPos: number): MentionState => {
    let start = -1;
    let trigger: Trigger | undefined;
    
    // 커서 위치에서 뒤로 검색하여 가장 가까운 트리거를 찾습니다.
    for (let i = caretPos - 1; i >= 0; i--) {
      const char = text[i];
      if (TRIGGERS.includes(char as Trigger)) {
        // 공백이 트리거 뒤에 있으면 무시
        if (i + 1 < text.length && text[i + 1] === ' ') continue;
        start = i;
        trigger = char as Trigger;
        break;
      }
      // 공백이나 줄바꿈을 만나면 검색 중단
      if (char === ' ' || char === '\n') break;
    }
    
    if (start === -1 || !trigger) {
      return { open: false, query: "" };
    }
    
    // 트리거 이후의 텍스트를 쿼리로 추출
    const query = text.slice(start + 1, caretPos);
    return { open: true, trigger, start, query };
  }, []);

  /**
   * 페이지네이션 상태 초기화
   */
  const resetPaginationState = useCallback(() => {
    setCurrentPage(1);
    setTotalPages(1);
    setTotalItems(0);
    setIsLoadingSuggestions(false);
    setLoadingMessage("");
  }, []);

  /**
   * 페이지 변경 핸들러
   */
  const handlePageChange = useCallback(async (page: number) => {
    if (!mention.open || !mention.query) return;
    
    setCurrentPage(page);
    const raw = mention.query.trim();
    const lower = raw.toLowerCase();
    
    try {
      let items: string[] = [];
      
      // @문서 or @문서:term => OpenSearch indices API 사용
      if (lower === "문서" || lower.startsWith("문서:")) {
        setIsLoadingSuggestions(true);
        setLoadingMessage(t('chatbot.mention.documentLoading'));
        
        let term = raw.slice(2);
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

  /**
   * 즉시 제안 목록 가져오기 (디바운스 없이)
   */
  const fetchSuggestionsNow = useCallback(async (
    trigger: Trigger | undefined,
    rawQuery: string
  ) => {
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
        const commands = [t('chatbot.mention.document'), t('urlContext.displayText')];
        const matchingCmds = commands.filter((c) => c.startsWith(lower));
        if (matchingCmds.length > 0) {
          setSuggestions(matchingCmds);
          setActiveIdx(0);
          return;
        }
      } else {
        // non-@ triggers에 대한 기본 동작 없음
        setSuggestions([]);
      }
    } catch (err) {
      setSuggestions([]);
    }
  }, [t]);

  /**
   * 디바운스된 제안 목록 가져오기
   */
  const fetchSuggestions = useCallback(async (
    trigger: Trigger | undefined,
    rawQuery: string
  ) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(async () => {
      await fetchSuggestionsNow(trigger, rawQuery);
    }, 200);
  }, [fetchSuggestionsNow]);

  /**
   * 멘션 닫기
   */
  const closeMention = useCallback(() => {
    setMention({ open: false, query: "" });
    setSuggestions([]);
    resetPaginationState();
  }, [resetPaginationState]);

  return {
    mention,
    setMention,
    suggestions,
    setSuggestions,
    activeIdx,
    setActiveIdx,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    isLoadingSuggestions,
    loadingMessage,
    computeMention,
    handlePageChange,
    fetchSuggestionsNow,
    fetchSuggestions,
    resetPaginationState,
    closeMention,
  };
}

