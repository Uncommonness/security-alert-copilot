'use client'
import { create } from 'zustand'

type AssistantState = {
  isOpen: boolean
  width: number // px
  isInitialized: boolean // 초기 로딩 완료 여부
  open: () => void
  close: () => void
  toggle: () => void
  setWidth: (w: number) => void
  setInitialized: () => void
}

export const useAssistant = create<AssistantState>((set) => ({
  isOpen: false,
  // default width; we'll initialize from localStorage once below when running in browser
  width: 400,
  isInitialized: false, // 초기 로딩 상태
  open: () => {
    set({ isOpen: true });
    // 챗봇 열림 시간 기록
    if (typeof window !== 'undefined') {
      (window as any).__chatbotLastOpenTime = Date.now();
    }
  },
  close: () => set({ isOpen: false }),
  toggle: () => set(state => {
    const newIsOpen = !state.isOpen;
    if (newIsOpen && typeof window !== 'undefined') {
      // 챗봇 열림 시간 기록
      (window as any).__chatbotLastOpenTime = Date.now();
    }
    return { isOpen: newIsOpen };
  }),
  setWidth: (width) => {
    try { localStorage.setItem('CHATBOT_WIDTH', String(Math.round(width))) } catch(e){}
    set({ width })
  },
  setInitialized: () => set({ isInitialized: true }),
}))

// Initialize width from localStorage once on client-side module load. This keeps
// persistence in one place (the store) and ensures the CSS variable is set so
// reopening the panel or refreshing the page restores the same width.
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('CHATBOT_WIDTH')
    const saved = raw ? Number(raw) : NaN
    if (!Number.isNaN(saved) && saved >= 120 && saved <= 1200) {
      try { useAssistant.setState({ width: Math.round(saved) }) } catch(e){}
      // 즉시 CSS 변수 설정 (페이지 로드 시)
      try { document.documentElement.style.setProperty('--assistant-width', `${Math.round(saved)}px`) } catch(e){}
    }
    // 초기 로딩 완료 후 애니메이션 활성화 (hydration 완료 후)
    setTimeout(() => {
      try {
        useAssistant.getState().setInitialized()
      } catch(e){}
    }, 200)
  } catch (e) {}
}
