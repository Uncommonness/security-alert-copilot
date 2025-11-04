import React, { useRef, useEffect } from 'react';

type Props = {
  open: boolean;
  items: string[];
  activeIndex: number;
  onClickItem: (name: string) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  isLoading?: boolean;
  loadingMessage?: string;
};

export default function MentionPopover({ 
  open, 
  items, 
  activeIndex, 
  onClickItem, 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange, 
  totalItems = 0, 
  itemsPerPage = 20,
  isLoading = false,
  loadingMessage = ""
}: Props) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(currentPage);
  const prevItemsRef = useRef<string[]>([]);

  // 페이지 변경 시 스크롤을 맨 위로 강제 초기화
  useEffect(() => {
    if (prevPageRef.current !== currentPage && scrollContainerRef.current && open) {
      // 페이지가 변경되었을 때만 스크롤 초기화
      scrollContainerRef.current.scrollTop = 0;
      prevPageRef.current = currentPage;
      
      // DOM 업데이트 후에도 다시 확인
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        });
      });
    }
  }, [currentPage, open]);

  // items 배열이 실제로 변경되었을 때도 스크롤 초기화 (로딩 완료 후)
  useEffect(() => {
    const itemsChanged = JSON.stringify(prevItemsRef.current) !== JSON.stringify(items);
    if (itemsChanged && !isLoading && scrollContainerRef.current && open) {
      // items가 변경되고 로딩이 끝났을 때 스크롤 초기화
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        });
      });
    }
    if (itemsChanged) {
      prevItemsRef.current = items;
    }
  }, [items, open, isLoading]);

  // activeIndex 변경 시 해당 항목으로 스크롤 (items가 렌더링된 후)
  useEffect(() => {
    if (open && items.length > 0 && activeIndex >= 0 && activeIndex < items.length) {
      // DOM 업데이트를 기다린 후 스크롤
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (itemRefs.current[activeIndex] && scrollContainerRef.current) {
            const itemElement = itemRefs.current[activeIndex];
            const container = scrollContainerRef.current;
            
            // 항목의 위치 확인
            const itemTop = itemElement.offsetTop;
            const itemBottom = itemTop + itemElement.offsetHeight;
            const containerTop = container.scrollTop;
            const containerBottom = containerTop + container.clientHeight;
            
            // 항목이 컨테이너 뷰포트 밖에 있으면 스크롤
            if (itemTop < containerTop || itemBottom > containerBottom) {
              itemElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
          }
        });
      });
    }
  }, [activeIndex, open, items]);

  // items 변경 시 itemRefs 배열 크기 조정 및 초기화
  useEffect(() => {
    itemRefs.current = new Array(items.length).fill(null);
  }, [items.length]);

  // 마우스 휠 이벤트로 스크롤 개선
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      // 기본 스크롤 동작 허용
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [open]);

  if (!open) return null;
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div 
      className="absolute bottom-20 left-0 z-50 w-[20rem] max-w-[90vw] rounded-xl shadow-lg overflow-hidden border border-[rgba(88,46,242,0.4)]" 
      style={{
        background: 'linear-gradient(135deg, rgba(20, 25, 38, 0.95) 0%, rgba(15, 18, 30, 0.98) 100%)',
        backdropFilter: 'blur(8px)'
      }}
      data-mention-popover
      onMouseDown={(e) => {
        e.stopPropagation(); // 팝오버 내부 모든 mousedown 이벤트 전파 차단
      }}
      onClick={(e) => {
        e.stopPropagation(); // 팝오버 내부 모든 click 이벤트 전파 차단
      }}
    >
      <div 
        ref={scrollContainerRef} 
        className="max-h-72 overflow-y-auto overflow-x-hidden"
        style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: 'rgba(100,100,100,0.6) rgba(20,25,38,0.8)',
          minHeight: isLoading || items.length === 0 ? '60px' : 'auto'
        }}
      >
        {isLoading ? (
          <div className="px-3 py-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[rgba(88,46,242,0.3)] border-t-[#592EF2]"></div>
              <span className="text-sm text-[#BFCAD9]">{loadingMessage}</span>
            </div>
          </div>
        ) : items.length > 0 ? (
          items.map((name, i) => (
            <button
              key={`${currentPage}-${i}-${name}`}
              ref={el => { itemRefs.current[i] = el; }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center min-w-0 transition-colors ${
                i === activeIndex 
                  ? 'bg-[rgba(88,46,242,0.35)] text-white' 
                  : 'text-[#BFCAD9] hover:bg-[rgba(88,46,242,0.2)] hover:text-white'
              }`}
              onMouseDown={(e) => { e.preventDefault(); onClickItem(name); }}
            >
              <span 
                className="font-mono text-xs px-1.5 py-0.5 rounded mr-2 flex-shrink-0"
                style={{
                  background: i === activeIndex 
                    ? 'rgba(88,46,242,0.4)' 
                    : 'rgba(88,46,242,0.2)',
                  border: '1px solid rgba(88,46,242,0.3)',
                  color: 'rgba(255,255,255,0.9)'
                }}
              >
                {name}
              </span>
              <span className="truncate">{name}</span>
            </button>
          ))
        ) : null}
      </div>
      
      {/* 페이지네이션 UI */}
      {totalPages > 1 && !isLoading && (
        <div 
          className="px-3 py-2 border-t flex items-center justify-between"
          style={{
            borderColor: 'rgba(88,46,242,0.4)',
            background: 'rgba(20,25,38,0.9)'
          }}
          onMouseDown={(e) => {
            e.stopPropagation(); // 페이지네이션 영역 클릭 시 외부 클릭 감지 방지
          }}
          onClick={(e) => {
            e.stopPropagation(); // 클릭 이벤트 전파 차단
          }}
        >
          <div className="flex items-center space-x-2">
            <button
              data-pagination-button="prev"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // 외부 클릭 감지 방지
                onPageChange?.(Math.max(1, currentPage - 1));
                // 포커스 이동 제거 - 팝오버가 닫히는 원인일 수 있음
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation(); // mousedown 이벤트 전파도 차단
              }}
              disabled={currentPage <= 1}
              className="px-2 py-1 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#BFCAD9] hover:text-white"
              style={{
                background: 'rgba(88,46,242,0.2)',
                border: '1px solid rgba(88,46,242,0.3)'
              }}
              onMouseEnter={(e) => {
                if (currentPage > 1) {
                  e.currentTarget.style.background = 'rgba(88,46,242,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(88,46,242,0.2)';
              }}
            >
              이전
            </button>
            <span className="text-xs text-[#BFCAD9]">
              {currentPage} / {totalPages}
            </span>
            <button
              data-pagination-button="next"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // 외부 클릭 감지 방지
                onPageChange?.(Math.min(totalPages, currentPage + 1));
                // 포커스 이동 제거 - 팝오버가 닫히는 원인일 수 있음
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation(); // mousedown 이벤트 전파도 차단
              }}
              disabled={currentPage >= totalPages}
              className="px-2 py-1 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#BFCAD9] hover:text-white"
              style={{
                background: 'rgba(88,46,242,0.2)',
                border: '1px solid rgba(88,46,242,0.3)'
              }}
              onMouseEnter={(e) => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.background = 'rgba(88,46,242,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(88,46,242,0.2)';
              }}
            >
              다음
            </button>
          </div>
          <div className="text-xs text-[#BFCAD9]/70">
            {startItem}-{endItem} / {totalItems}
          </div>
        </div>
      )}
      
      <div 
        className="px-3 py-1.5 text-[11px] border-t"
        style={{
          borderColor: 'rgba(88,46,242,0.4)',
          background: 'rgba(20,25,38,0.9)',
          color: 'rgba(191,202,217,0.7)'
        }}
      >
        ↑/↓ 이동 · Enter 선택 · Esc 닫기{totalPages > 1 ? ' · ←/→ 페이지' : ''}
      </div>
    </div>
  );
}
