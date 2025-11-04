"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

type Props = {
  onClose: () => void;
  dontShow: boolean;
  onChangeDontShow: (next: boolean) => void;
  onGoChat: () => void;
};

type Msg = { id: string; role: "assistant" | "user"; text: string };

const messagesSeed: Msg[] = [
  { id: "m1", role: "assistant", text: "안녕하세요! Security Alert Copilot을 도와드릴게요" },
  { id: "m2", role: "user", text: "최근 보안 이벤트를 확인해주세요" },
  { id: "m3", role: "assistant", text: "지난 24시간 동안 3건의 의심스러운 활동이 감지되었습니다" },
  { id: "m4", role: "user", text: "자세히 알려주세요" },
  { id: "m5", role: "assistant", text: "WIN-ABC123 시스템에서 의심스러운 네트워크 연결이 감지되었습니다. MITRE ATT&CK T1059.001 기법이 사용된 것으로 보입니다." },
];

export default function HoverAssistantHint({ onClose, dontShow, onChangeDontShow, onGoChat }: Props) {
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const timersRef = useRef<number[]>([]);
  const isMounted = useRef(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const chatMessages = useMemo(() => messagesSeed, []);

  // 자동 스크롤 함수
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const maxScrollTop = scrollHeight - clientHeight;
      
      if (maxScrollTop > 0) {
        container.scrollTo({
          top: maxScrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  // 안전한 시퀀스 플레이어: 재오픈 시 항상 처음부터, 경계 체크 철저
  useEffect(() => {
    isMounted.current = true;
    setVisibleIds([]);
    
    // 기존 타이머 모두 정리
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    
    // 0.8s 후 시작, 1.0s 간격으로 순차 등장 (더 빠르게)
    const baseDelay = 800;
    const step = 1000;

    chatMessages.forEach((m, i) => {
      const id = window.setTimeout(() => {
        if (!isMounted.current) return;
        // 경계 체크: messagesSeed 배열 범위 내에서만 처리
        if (i < chatMessages.length && chatMessages[i]?.id === m.id) {
          setVisibleIds((prev) => (prev.includes(m.id) ? prev : [...prev, m.id]));
          
          // 메시지가 추가된 후 자동 스크롤
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      }, baseDelay + i * step);
      timersRef.current.push(id);
    });

    return () => {
      isMounted.current = false;
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [chatMessages, scrollToBottom]);

  // 배경 클릭 시 닫기 (아래 페이지 이벤트 차단)
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    onClose();
  };
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="fixed inset-0 z-[1200] pointer-events-auto">
      {/* 배경 딤 + 블러 (클릭 시 닫기, 하위로 클릭 전파 금지) */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      {/* 힌트창 */}
      <div
        className="absolute top-1/2 left-1/2 w-[800px] h-[600px] max-w-[90vw] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-gray-300/60 animate-[slideInUp_0.4s_ease-out]"
        role="dialog"
        aria-modal="true"
        onClick={stop}
      >
        {/* 축소된 전체 페이지 느낌의 프리뷰 */}
        <div className="relative h-full bg-gray-50">
          {/* 모사한 상단바: 왼쪽으로 버튼 이동 애니메이션 */}
          <div className="relative h-12 bg-[#1CCA5D] text-white flex items-center px-4 overflow-hidden">
            <div className="flex items-center gap-3 animate-[shiftLeft_0.6s_ease-out_forwards] min-w-0">
              <div className="w-8 h-8 bg-white/10 rounded flex-shrink-0" />
              <div className="w-8 h-8 bg-white/10 rounded flex-shrink-0" />
              <div className="w-8 h-8 bg-white/10 rounded flex-shrink-0" />
            </div>
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/20">
                <div className="w-2 h-2 bg-[#1CCA5D] rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700">Security Alert Copilot</span>
                <div className="w-px h-4 bg-gray-300"></div>
                <span className="text-xs text-gray-500 font-medium">미리보기</span>
              </div>
            </div>
          </div>

          {/* 실제 대시보드와 유사한 메인 콘텐츠 영역 */}
          <div className="relative h-[calc(100%-4rem)] bg-gray-50">
            {/* 사이드바 영역 */}
            <div className="absolute left-0 top-0 w-16 h-full bg-white border-r border-gray-200 shadow-sm">
              <div className="flex flex-col items-center py-4 space-y-3">
                <div className="w-8 h-8 bg-[#1CCA5D]/20 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#1CCA5D] rounded" />
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-400 rounded" />
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-400 rounded" />
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-400 rounded" />
                </div>
              </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="ml-16 h-full p-6">
              {/* 페이지 헤더 */}
              <div className="mb-6">
                <div className="h-7 bg-gray-800 rounded-md w-56 mb-3" />
                <div className="h-4 bg-gray-300 rounded w-40" />
              </div>

              {/* 대시보드 카드들 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 bg-gray-300 rounded w-24" />
                    <div className="w-6 h-6 bg-[#1CCA5D]/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-[#1CCA5D] rounded-full" />
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 bg-gray-300 rounded w-28" />
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              </div>

              {/* 데이터 테이블 영역 */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="h-5 bg-gray-400 rounded w-40" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-3 py-2">
                    <div className="w-4 h-4 bg-[#1CCA5D]/20 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#1CCA5D] rounded-full" />
                    </div>
                    <div className="h-4 bg-gray-300 rounded flex-1" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </div>
                  <div className="flex items-center space-x-3 py-2">
                    <div className="w-4 h-4 bg-yellow-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    </div>
                    <div className="h-4 bg-gray-300 rounded flex-1" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                  <div className="flex items-center space-x-3 py-2">
                    <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <div className="h-4 bg-gray-300 rounded flex-1" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              </div>
            </div>

            {/* 실제 Assistant 패널과 유사한 구조 */}
            <div className="absolute top-0 right-0 w-[400px] h-full bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.15)] border-l border-gray-200/80 animate-[slideInPanel_0.5s_ease-out_forwards]">
              {/* 미리보기 전용 Assistant 헤더 */}
              <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#1CCA5D]/10 to-[#16A34A]/10 border-b border-[#1CCA5D]/20 h-12 relative">
                {/* 미리보기 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                
                <div className="relative flex items-center gap-2">
                  {/* 미리보기 아이콘 */}
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 bg-[#1CCA5D]/30 rounded-md"></div>
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-md border border-[#1CCA5D]/30 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#1CCA5D]">
                        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* 미리보기 텍스트 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1CCA5D]">Assistant</span>
                  </div>
                </div>
                
              </div>

              {/* Assistant Panel (assistant-slot과 유사) */}
              <div className="h-[calc(100%-3rem)] bg-gray-50 overflow-hidden">
                {/* 채팅 영역 */}
                <div 
                  ref={chatContainerRef}
                  className="h-full overflow-y-auto px-4 pt-4 pr-6 space-y-2 scrollbar-hide" 
                  style={{ 
                    paddingBottom: '16px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {chatMessages.map((m) =>
                    visibleIds.includes(m.id) ? (
                      <div
                        key={m.id}
                        className={`flex ${
                          m.role === "assistant" ? "justify-start" : "justify-end"
                        } mb-3 px-2`}
                      >
                        <div
                          className={`flex flex-col min-w-0 ${
                            m.role === "assistant" ? "items-start" : "items-end"
                          }`}
                          style={{ 
                            maxWidth: "80%"
                          }}
                        >
                          <div
                            className={`px-3 py-2 rounded-xl break-words transition-all duration-200 overflow-wrap-anywhere shadow-sm backdrop-blur-sm animate-[bubbleIn_0.28s_ease-out] ${
                              m.role === "assistant"
                                ? "bg-white/80 text-gray-800 border border-gray-200/60 hover:border-gray-300/80 hover:bg-white/90 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
                                : "bg-green-100/90 text-black border border-green-200/60 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:border-green-300"
                            }`}
                            style={{ 
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere',
                              hyphens: 'auto',
                              maxWidth: '100%',
                              willChange: 'transform',
                              transform: 'translateZ(0)',
                              fontSize: '14px',
                              lineHeight: '1.4'
                            }}
                          >
                            <p style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', hyphens: 'auto', margin: 0 }}>
                              {m.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 하단 CTA 바: 힌트창 내부 하단에 고정 */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  checked={dontShow}
                  onChange={(e) => onChangeDontShow(e.target.checked)}
                  style={{
                    appearance: 'auto',
                    WebkitAppearance: 'checkbox',
                    MozAppearance: 'checkbox'
                  }}
                />
                <span className="select-none">다시 보지 않기</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-5 py-3 text-base rounded-xl border border-gray-300 hover:bg-gray-50 active:scale-[0.99] transition"
                >
                  닫기
                </button>
                <button
                  onClick={onGoChat}
                  className="px-5 py-3 text-base rounded-xl bg-[#1CCA5D] text-white hover:bg-[#16A34A] active:scale-[0.99] transition"
                >
                  채팅하러 가기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 키프레임 */}
        <style jsx>{`
          @keyframes slideInUp {
            from { transform: translate(-50%, calc(-50% + 12px)); opacity: 0; }
            to { transform: translate(-50%, -50%); opacity: 1; }
          }
          @keyframes shiftLeft {
            from { transform: translateX(0); }
            to { transform: translateX(-12px); }
          }
          @keyframes slideInPanel {
            from { transform: translateX(16px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes bubbleIn {
            from { transform: translateY(6px) scale(0.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          
          /* 스크롤바 숨기기 */
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}
