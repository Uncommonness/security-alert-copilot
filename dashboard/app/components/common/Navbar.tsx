"use client";

import type React from 'react';
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useSidebar } from '../../contexts/SidebarContext';
import Button from '../ui/Button';
import LanguageDropdown from '../ui/LanguageDropdown';
import Brand from './Brand';
import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAssistant } from '@/app/providers/assistant-store';
import SettingsButton from '@/app/components/ui/SettingsButton';
import Chatbot from './Chatbot';
import HoverAssistantHint from './HoverAssistantHint';
import useAssistantOpen from '@/app/hooks/useAssistantOpen';
import {
  Bars3Icon,
  ChatBubbleOvalLeftEllipsisIcon,
  PlusIcon,
  RectangleStackIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Chatbot rendered in docked AssistantPanel; Navbar only toggles it via store

const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 600;
const PANEL_MARGIN_RIGHT = 4;
const PANEL_MARGIN_BOTTOM = 52;
const CHATBOT_POS_KEY = 'chatbot-panel-pos-v1';

// 공통 아이콘 버튼(드래그 방지/접근성/호버/포커스 일관)
function IconButton({
  label,
  title,
  onClick,
  children,
  className = '',
}: {
  label: string;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title || label}
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()} // 헤더 드래그 방지
      className={[
        'p-1.5 rounded',
        'text-white hover:text-white',
        'hover:bg-white/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        'active:scale-95',
        'transition duration-150',
        className,
      ].join(' ')}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { open, setOpen } = useSidebar();

  // control docked assistant
  const { isOpen: assistantOpen, toggle: toggleAssistant, close: closeAssistant } = useAssistant();
  // detect whether the chatbot is docked (sidecar) so we can avoid rendering duplicate header controls in the top navbar
  const [isDocked, setIsDocked] = useState(false);

  // 힌트창 관련 상태
  const [showHint, setShowHint] = useState(false);
  const [persistHint, setPersistHint] = useState(false); // 호버 해제 후에도 유지 여부
  const [dontShow, setDontShow] = useState(false);

  const isAssistantOpen = useAssistantOpen(); // DOM+LS+data-attr로 3중 판정

  // 초기 로드 시 "다시 보지 않기" 반영
  useEffect(() => {
    const ls = typeof window !== "undefined" ? window.localStorage.getItem("ASSIST_HINT_HIDE") : null;
    const ck = typeof document !== "undefined" ? document.cookie.includes("ASSIST_HINT_HIDE=1") : false;
    setDontShow(ls === "1" || ck);
  }, []);

  const handleHover = useCallback(() => {
    if (dontShow || isAssistantOpen) return;
    setShowHint(true);
    setPersistHint(true); // 호버가 끝나도 유지
  }, [dontShow, isAssistantOpen]);

  const closeHint = useCallback(() => {
    setShowHint(false);
    setPersistHint(false);
  }, []);

  const toggleDontShow = useCallback((next: boolean) => {
    setDontShow(next);
    if (typeof window !== "undefined") {
      if (next) {
        window.localStorage.setItem("ASSIST_HINT_HIDE", "1");
        document.cookie = `ASSIST_HINT_HIDE=1; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
      } else {
        window.localStorage.removeItem("ASSIST_HINT_HIDE");
        document.cookie = `ASSIST_HINT_HIDE=; path=/; max-age=0`;
      }
    }
  }, []);

  const goToChat = useCallback(() => {
    // "채팅하러 가기" 액션: 실제 라우트/포커스 로직에 맞게 교체
    closeHint();
    toggleAssistant(); // Assistant 열기
  }, [closeHint, toggleAssistant]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const SIDECAR_LS_KEY = 'CHATBOT_DOCKED';
    const check = () => {
      try {
        const attr = document.documentElement.getAttribute('data-sidecar');
        if (attr === 'right-open') {
          setIsDocked(true);
          return;
        }
        // fallback to localStorage flag used by Chatbot
        const ls = localStorage.getItem(SIDECAR_LS_KEY) === '1';
        setIsDocked(!!ls);
      } catch (e) {
        setIsDocked(false);
      }
    };
    check();

    // Observe attribute changes on <html> so we react immediately when Chatbot sets data-sidecar
    let mo: MutationObserver | null = null;
    try {
      mo = new MutationObserver(() => {
        check();
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-sidecar'] });
    } catch (e) {
      mo = null;
    }

    const onToggle = () => check();
    const onOpen = () => check();
    const onClose = () => check();
    window.addEventListener('chatbot:toggleDock', onToggle as EventListener);
    window.addEventListener('chatbot:openDock', onOpen as EventListener);
    window.addEventListener('chatbot:closeDock', onClose as EventListener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === SIDECAR_LS_KEY) check();
    };
    window.addEventListener('storage', onStorage as any);
    return () => {
      if (mo) mo.disconnect();
      window.removeEventListener('chatbot:toggleDock', onToggle as EventListener);
      window.removeEventListener('chatbot:openDock', onOpen as EventListener);
      window.removeEventListener('chatbot:closeDock', onClose as EventListener);
      window.removeEventListener('storage', onStorage as any);
    };
  }, []);


  // Floating panel state (legacy floating UI)
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 80, y: 80 });
  const [panelSize, setPanelSize] = useState({ width: PANEL_WIDTH, height: PANEL_HEIGHT });
  const [resizingDir, setResizingDir] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHATBOT_POS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p && p.x != null && p.y != null) setPanelPos(p);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging) {
        setPanelPos((prev) => ({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y }));
      } else if (resizingDir) {
        setPanelSize((prev) => {
          let nw = prev.width;
          let nh = prev.height;
          if (resizingDir.includes('e')) nw = Math.max(400, Math.min(650, e.clientX - panelPos.x));
          if (resizingDir.includes('s')) nh = Math.max(200, Math.min(window.innerHeight - 20, e.clientY - panelPos.y));
          if (resizingDir.includes('w')) {
            const delta = panelPos.x - e.clientX;
            nw = Math.max(400, Math.min(650, prev.width + delta));
            setPanelPos((p) => ({ x: Math.max(8, e.clientX), y: p.y }));
          }
          if (resizingDir.includes('n')) {
            const delta = panelPos.y - e.clientY;
            nh = Math.max(200, Math.min(window.innerHeight - 20, prev.height + delta));
            setPanelPos((p) => ({ x: p.x, y: Math.max(8, e.clientY) }));
          }
          return { width: nw, height: nh };
        });
      }
    };
    const onUp = () => {
      setDragging(false);
      setResizingDir(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, resizingDir, panelPos.x, panelPos.y]);

  function startResize(dir: string, e: React.MouseEvent) {
    e.stopPropagation();
    setResizingDir(dir);
  }

  return (
    <>
  <nav className="w-full text-white flex items-center shadow-md z-30 h-navbar px-5" style={{ background: 'linear-gradient(135deg, #29F280 0%, #24733F 100%)' }}>
        <div className="flex items-center gap-3">
          <button
            aria-label="패널 접기"
            onClick={() => setOpen((v: boolean) => !v)}
            className="inline-flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95 transition min-w-[44px] min-h-[44px]"
          >
            <Bars3Icon className="w-6 h-6 md:w-5 md:h-5 text-white" aria-hidden />
          </button>
          <Brand />
        </div>
        <div className={`ml-auto flex items-center gap-2 transition-all duration-200 ${
          assistantOpen ? 'md:mr-[var(--assistant-width,400px)]' : ''
        }`}>
          <LanguageDropdown />
          {/* Dashboard Assistant 버튼 */}
          <div className="flex items-center ml-2">
            <div className="relative w-auto h-auto perspective-500">
              {/* 글래스 프론트 레이어 */}
              <button
                aria-label={assistantOpen ? "Assistant 닫기" : "Assistant 열기"}
                onClick={() => toggleAssistant()}
                onMouseEnter={handleHover}
                className={`group relative inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 overflow-hidden transform-gpu min-h-[44px] ${
                  assistantOpen 
                    ? 'bg-white/25 text-white backdrop-blur-md border border-white/40 shadow-lg shadow-white/20' 
                    : 'bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-md shadow-white/10 hover:bg-white/25 hover:border-white/40 hover:shadow-lg hover:shadow-white/20'
                }`}
                style={{
                  transform: 'translateZ(0)',
                  transformOrigin: 'top left'
                }}
                title="Dashboard Assistant"
              >
                {/* SVG 프레임 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <rect 
                    width="100" 
                    height="100" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth="2" 
                    rx="16"
                  />
                </svg>
                
         {/* 아이콘과 텍스트 */}
         <div className="relative z-10 flex items-center gap-2">
           <span className="text-sm font-semibold hidden md:inline tracking-wide text-white drop-shadow-sm">Assistant</span>
         </div>
                
                {/* 단축키 표시 */}
                <div className="relative z-10 hidden lg:flex items-center gap-1 ml-2">
                  <div className="flex items-center gap-0.5 text-xs text-white/90">
                    <kbd className="px-2 py-1 bg-white/30 border border-white/50 rounded-md text-xs font-mono shadow-sm group-hover:bg-white/40 transition-colors duration-200 text-white/90">Ctrl</kbd>
                    <span className="text-white/70 font-medium">+</span>
                    <kbd className="px-2 py-1 bg-white/30 border border-white/50 rounded-md text-xs font-mono shadow-sm group-hover:bg-white/40 transition-colors duration-200 text-white/90">/</kbd>
                  </div>
                </div>
                
                {/* 상태 표시 점 */}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300 ${
                  assistantOpen 
                    ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' 
                    : 'bg-white/50 group-hover:bg-white/70 shadow-sm'
                }`}></div>
              </button>
            </div>
          </div>

          {/* 액션 버튼은 이제 Assistant 도킹 헤더 내부로 이동했습니다. */}
        </div>
      </nav>
      {/* Floating chatbot panel (legacy) - toggled independently of docked AssistantPanel */}
      {chatbotOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[100] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col"
          style={{
            top: panelPos.y,
            left: panelPos.x,
            width: panelSize.width,
            height: panelSize.height,
            position: 'fixed',
            cursor: dragging ? 'grabbing' : 'default',
            minWidth: 320,
            minHeight: 200,
            maxWidth: '100vw',
            maxHeight: '100vh',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2 border-b rounded-t-xl select-none cursor-move"
            style={{ background: 'linear-gradient(135deg, #29F280 0%, #24733F 100%)' }}
            onMouseDown={e => {
              dragOffset.current = { x: (e as any).clientX - panelPos.x, y: (e as any).clientY - panelPos.y };
              setDragging(true);
            }}
          >
            <span className="text-white font-semibold">Security Alert Copilot</span>
            <div className="flex items-center gap-2">
              <IconButton
                label="새 채팅"
                onClick={() => window.dispatchEvent(new Event('chatbot:newChat'))}
              >
                <PlusIcon className="w-5 h-5" aria-hidden />
              </IconButton>

              <IconButton
                label="과거 채팅"
                onClick={() => window.dispatchEvent(new Event('chatbot:toggleHistory'))}
              >
                <RectangleStackIcon className="w-5 h-5" aria-hidden />
              </IconButton>

              <div onMouseDown={(e) => e.stopPropagation()}>
                <SettingsButton size={18} className="!p-1 rounded" />
              </div>

              <IconButton
                label="챗봇 닫기"
                onClick={() => {
                  try { localStorage.setItem(CHATBOT_POS_KEY, JSON.stringify(panelPos)); } catch (e) {}
                  setChatbotOpen(false);
                }}
              >
                <XMarkIcon className="w-5 h-5" aria-hidden />
              </IconButton>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col animate-[fadeIn_.18s_ease-out]">
            <Chatbot />
          </div>

          {[
            { dir: 'n', style: { top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }, className: 'hover:bg-gray-200/50 transition-colors duration-150' },
            { dir: 's', style: { bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }, className: 'hover:bg-gray-200/50 transition-colors duration-150' },
            { dir: 'e', style: { top: 0, right: 0, bottom: 0, width: 6, cursor: 'ew-resize' }, className: 'hover:bg-gray-200/50 transition-colors duration-150' },
            { dir: 'w', style: { top: 0, left: 0, bottom: 0, width: 6, cursor: 'ew-resize' }, className: 'hover:bg-gray-200/50 transition-colors duration-150' },
            { dir: 'ne', style: { top: 0, right: 0, width: 12, height: 12, cursor: 'nesw-resize' }, className: 'hover:bg-gray-200/50 transition-colors duration-150' },
            { dir: 'nw', style: { top: 0, left: 0, width: 12, height: 12, cursor: 'nwse-resize' }, className: 'hover:bg-gray-200/50 transition-colors duration-150' },
            { dir: 'se', style: { right: 0, bottom: 0, width: 12, height: 12, cursor: 'nwse-resize' }, className: 'hover:bg-gray-200/50 transition-colors duration-150' },
            { dir: 'sw', style: { left: 0, bottom: 0, width: 12, height: 12, cursor: 'nesw-resize' }, className: 'hover:bg-gray-200/50 transition-colors duration-150' },
          ].map(h => (
            <div
              key={h.dir}
              className={`absolute z-30 ${h.className}`}
              style={h.style}
              onMouseDown={e => startResize(h.dir, e as any)}
              aria-label={`resize-${h.dir}`}
            />
          ))}
        </div>,
        document.body
      )}

      {/* 힌트창 포털 */}
      {(showHint || persistHint) &&
        typeof document !== "undefined" &&
        createPortal(
          <HoverAssistantHint
            onClose={closeHint}
            dontShow={dontShow}
            onChangeDontShow={toggleDontShow}
            onGoChat={goToChat}
          />,
          document.body
        )}
    </>
  );
}
