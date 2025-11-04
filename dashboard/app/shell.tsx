'use client'
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useAssistant } from './providers/assistant-store'
import { useSidebar } from './contexts/SidebarContext'
import AssistantPanel from './ui/assistant-panel'
import FloatingNav from './components/common/FloatingNav'
import { usePathname } from 'next/navigation'

export default function ClientShell({ children }: PropsWithChildren) {
  const { isOpen, width, isInitialized, toggle: toggleAssistant } = useAssistant()
  const { open: sidebarOpen } = useSidebar()
  const rootRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // 홈페이지인지 확인 (경로가 /ko 또는 /en만 있는 경우)
  const isHomePage = pathname && (pathname === '/ko' || pathname === '/en')

  // 전역 키보드 단축키 이벤트 리스너 추가
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + / 단축키로 Assistant 토글
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault()
        event.stopPropagation()
        toggleAssistant()
      }
    }

    // window 레벨에서 이벤트 리스너 등록 (더 높은 우선순위)
    window.addEventListener('keydown', handleKeyDown, true) // capture phase에서 처리
    document.addEventListener('keydown', handleKeyDown, true) // 추가 보장

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [toggleAssistant])

  useEffect(() => {
    if (rootRef.current) {
      const headerSlot = rootRef.current.querySelector('.assistant-header-slot') as HTMLElement;
      const assistantSlot = rootRef.current.querySelector('.assistant-slot') as HTMLElement;
      
      if (isOpen) {
        // 패널이 열려있을 때는 오버레이 방식으로 적용
        const w = `${width}px`
        try { rootRef.current.style.setProperty('--assistant-width', w); } catch(e){}
        // 그리드 레이아웃은 유지하되, 메인 콘텐츠는 그대로 두고 채팅창만 오버레이로 표시
        try { rootRef.current.style.setProperty('grid-template-columns', '1fr'); } catch(e){}
        // 슬롯들을 보이게 함
        if (headerSlot) headerSlot.style.display = 'block';
        if (assistantSlot) assistantSlot.style.display = 'block';
      } else {
        // 패널이 닫혀있을 때는 1열 레이아웃 적용
        try { rootRef.current.style.setProperty('grid-template-columns', '1fr'); } catch(e){}
        try { rootRef.current.style.removeProperty('--assistant-width'); } catch(e){}
        // 슬롯들을 숨김
        if (headerSlot) headerSlot.style.display = 'none';
        if (assistantSlot) assistantSlot.style.display = 'none';
      }
    }
  }, [isOpen, width])

  // 페이지 로드 시 localStorage에서 width 복원
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('CHATBOT_WIDTH')
        if (saved) {
          const widthValue = Number(saved)
          if (!Number.isNaN(widthValue) && widthValue >= 120 && widthValue <= 1200) {
            const w = `${widthValue}px`
            try { rootRef.current?.style.setProperty('--assistant-width', w); } catch(e){}
          }
        }
      } catch (e) {}
    }
  }, [])

  const mainPadding = '0px'

  return (
    <div ref={rootRef} style={{ background: '#141926', minHeight: '100vh' }}>
      {/* 홈페이지가 아닐 때만 FloatingNav 렌더링 */}
      {!isHomePage && <FloatingNav />}
      
      {/* Assistant Header Slot */}
      <div className="assistant-header-slot" />
      
      <main>{children}</main>
      <aside className="assistant-slot">
        <AssistantPanel />
      </aside>
    </div>
  )
}
