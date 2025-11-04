'use client'
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAssistant } from '../providers/assistant-store'
import Chatbot from '../components/common/Chatbot'
import AssistantResizer from './assistant-resizer'

export default function AssistantPanel(){
  const { isOpen, width, setWidth, close } = useAssistant()
  const panelRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = React.useState(false)

  // 모바일 감지
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Keep DOM in sync with store width so opening the panel shows correct size immediately
  useEffect(() => {
    try {
      const val = Math.round(width)
      const root = document.querySelector('.app-grid') as HTMLElement | null
      
      if (isOpen) {
        // 패널이 열려있을 때만 CSS 변수 설정
        if (root) {
          root.style.setProperty('--assistant-width', `${val}px`)
        } else {
          document.documentElement.style.setProperty('--assistant-width', `${val}px`)
        }
        if (panelRef.current) {
          panelRef.current.style.width = `${val}px`
        }
      } else {
        // 패널이 닫혀있을 때 CSS 변수 제거
        if (root) {
          root.style.removeProperty('--assistant-width')
        } else {
          document.documentElement.style.removeProperty('--assistant-width')
        }
      }
    } catch(e) {}
  }, [width, isOpen])

  // 채팅창이 열릴 때 입력란에 포커스
  useEffect(() => {
    if (isOpen) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 포커스
      const timer = setTimeout(() => {
        try {
          (window as any).focusChatbotInput?.();
        } catch (e) {
          console.warn('Failed to focus chatbot input:', e);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 페이지 로드 시 localStorage에서 width 복원 (추가 보장)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('CHATBOT_WIDTH')
        if (saved) {
          const widthValue = Number(saved)
          if (!Number.isNaN(widthValue) && widthValue >= 120 && widthValue <= 1200) {
            const val = Math.round(widthValue)
            const root = document.querySelector('.app-grid') as HTMLElement | null
            if (root) {
              root.style.setProperty('--assistant-width', `${val}px`)
            } else {
              try { document.documentElement.style.setProperty('--assistant-width', `${val}px`) } catch(e){}
            }
          }
        }
      } catch (e) {}
    }
  }, [])

  // panel-level ResizeObserver remains; resizer UI is provided by AssistantResizer below

  // no collapse toggle: keep thin resizer only

  // Document-level delegate removed: AssistantResizer handles mousedown/mousemove/mouseup
  // directly on the resizer element. This prevents duplicate handling and reduces
  // lag caused by console logging during drags.

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box && Math.abs(box.width - width) > 1 && box.width > 0) {
        setWidth(Math.round(box.width))
      }
    })
    if (panelRef.current) ro.observe(panelRef.current)
    return () => {
      try { ro.disconnect() } catch(e){}
      // Clean up CSS variable so closing the panel doesn't leave empty space
      try {
        const root = document.querySelector('.app-grid') as HTMLElement | null
        if (root) {
          root.style.removeProperty('--assistant-width')
          try { root.style.removeProperty('grid-template-columns') } catch(e){}
        }
        try { document.documentElement.style.removeProperty('--assistant-width') } catch(e){}
      } catch(e){}
    }
  }, [setWidth, width])

  // Assistant Header Component
  const AssistantHeader = () => (
    <div className="flex items-center justify-between px-4 py-2 h-12 relative transition-all duration-200" style={{ 
      background: 'rgba(20, 24, 38, 0.95)', 
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(88, 46, 242, 0.3)'
    }}>
      <div className="relative flex items-center gap-3">
        {/* 텍스트 */}
        <div className="relative">
          <h2 className="font-bold text-base text-white tracking-tight" style={{ 
            textShadow: '0 2px 8px rgba(255, 255, 255, 0.1)'
          }}>
            Security Alert Copilot
          </h2>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="relative flex items-center gap-1.5">
        <button
          type="button"
          aria-label="새 채팅"
          title="새 채팅"
          onClick={() => window.dispatchEvent(new Event('chatbot:newChat'))}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29F280] active:scale-95 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(41, 242, 128, 0.15) 0%, rgba(35, 114, 63, 0.12) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(41, 242, 128, 0.3)',
            color: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 6px rgba(41, 242, 128, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(41, 242, 128, 0.25) 0%, rgba(35, 114, 63, 0.2) 100%)';
            e.currentTarget.style.borderColor = 'rgba(41, 242, 128, 0.5)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 242, 128, 0.2)';
            e.currentTarget.style.color = '#29F280';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(41, 242, 128, 0.15) 0%, rgba(35, 114, 63, 0.12) 100%)';
            e.currentTarget.style.borderColor = 'rgba(41, 242, 128, 0.3)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(41, 242, 128, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="sr-only">새 채팅</span>
        </button>

        <button
          type="button"
          aria-label="과거 채팅"
          title="과거 채팅"
          onClick={() => window.dispatchEvent(new Event('chatbot:toggleHistory'))}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29F280] active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(88, 46, 242, 0.15) 0%, rgba(69, 26, 210, 0.12) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(88, 46, 242, 0.3)',
            color: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 6px rgba(88, 46, 242, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 46, 242, 0.25) 0%, rgba(69, 26, 210, 0.2) 100%)';
            e.currentTarget.style.borderColor = 'rgba(88, 46, 242, 0.5)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 46, 242, 0.2)';
            e.currentTarget.style.color = '#BFCAD9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 46, 242, 0.15) 0%, rgba(69, 26, 210, 0.12) 100%)';
            e.currentTarget.style.borderColor = 'rgba(88, 46, 242, 0.3)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(88, 46, 242, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122"/>
          </svg>
          <span className="sr-only">과거 채팅</span>
        </button>

        <div onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="설정"
            aria-label="설정"
            onClick={() => { window.dispatchEvent(new Event('chatbot:toggleSettings')); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29F280] active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(88, 46, 242, 0.15) 0%, rgba(69, 26, 210, 0.12) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(88, 46, 242, 0.3)',
              color: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 6px rgba(88, 46, 242, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 46, 242, 0.25) 0%, rgba(69, 26, 210, 0.2) 100%)';
              e.currentTarget.style.borderColor = 'rgba(88, 46, 242, 0.5)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 46, 242, 0.2)';
              e.currentTarget.style.color = '#BFCAD9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 46, 242, 0.15) 0%, rgba(69, 26, 210, 0.12) 100%)';
              e.currentTarget.style.borderColor = 'rgba(88, 46, 242, 0.3)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(88, 46, 242, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
              <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            </svg>
            <span className="sr-only">설정</span>
          </button>
        </div>

        <button
          type="button"
          aria-label="챗봇 닫기"
          title="챗봇 닫기"
          onClick={() => { try { close(); } catch(e){} }}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 active:scale-95 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.12) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.2) 100%)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.12) 100%)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="sr-only">챗봇 닫기</span>
        </button>
      </div>
    </div>
  )

  if (!isOpen) return null
  
  return (
    <>
      {/* Assistant Header in assistant-header-slot */}
      {typeof document !== 'undefined' && (() => {
        const target = document.querySelector('.assistant-header-slot');
        if (target) {
          return createPortal(<AssistantHeader />, target);
        }
        return null;
      })()}
      
      {/* Assistant Panel */}
      <div ref={panelRef} className="assistant-panel md:relative" style={{ 
        width: isMobile ? '100vw' : 'var(--assistant-width)', 
        height: 'calc(100vh)', 
        display: 'block', 
        position: 'fixed', 
        top: '0', 
        right: '0', 
        zIndex: 9999,
        background: '#141926',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ position:'relative', height:'100%' }}>
              <div style={{ position:'absolute', inset:0, overflow:'auto' }}>
                <Chatbot embedded />
              </div>
              <AssistantResizer containerRef={panelRef} />
        </div>
      </div>
    </>
  )
}
