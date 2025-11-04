'use client'
import React from 'react'
import { useAssistant } from '../providers/assistant-store'

type Props = {
  containerRef?: React.RefObject<HTMLElement>
}

export default function AssistantResizer({ containerRef }: Props) {
  const { width, setWidth } = useAssistant()

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const el = e.currentTarget as HTMLElement
    const pointerId = e.pointerId
    const startX = e.clientX
    const startW = (containerRef?.current?.offsetWidth) || width || 400

    el.setPointerCapture(pointerId)
    document.body.style.cursor = 'ew-resize'
    document.documentElement.classList.add('is-resizing')
    document.documentElement.style.userSelect = 'none';
    document.body.style.userSelect = 'none';

    let raf = 0
    let lastNext = startW

    const applyVisual = (next: number) => {
      const root = document.querySelector('.app-grid') as HTMLElement | null
      if (root) {
        root.style.setProperty('--assistant-width', `${next}px`)
      } else {
        document.documentElement.style.setProperty('--assistant-width', `${next}px`)
      }
      // 패널 자체의 너비도 직접 업데이트
      if (containerRef?.current) {
        containerRef.current.style.width = `${next}px`
      }
    }

    const onMove = (ev: PointerEvent) => {
      const delta = startX - (ev.clientX || 0)
      const minWidth = 400  // 최소 너비: 400px
      const maxWidth = 650  // 최대 너비: 650px
      const next = Math.max(minWidth, Math.min(maxWidth, startW + delta))
      lastNext = next
      if (!raf) {
        raf = requestAnimationFrame(() => {
          applyVisual(lastNext)
          setWidth(Math.round(lastNext))
          raf = 0
        })
      }
    }

    const onUp = () => {
      document.body.style.cursor = ''
      if (raf) cancelAnimationFrame(raf)
      el.releasePointerCapture(pointerId)
      
      const root = document.querySelector('.app-grid') as HTMLElement | null
      if (root) root.style.removeProperty('grid-template-columns')
      
      document.documentElement.classList.remove('is-resizing')
      document.documentElement.style.removeProperty('user-select');
      document.body.style.removeProperty('user-select')

      window.removeEventListener('pointermove', onMove as EventListener)
      window.removeEventListener('pointerup', onUp as EventListener)
      window.removeEventListener('pointercancel', onUp as EventListener)
    }

    window.addEventListener('pointermove', onMove as EventListener)
    window.addEventListener('pointerup', onUp as EventListener)
    window.addEventListener('pointercancel', onUp as EventListener)
  }

  return (
    <div
      data-resizer
      role="separator"
      aria-orientation="vertical"
      title="Resize assistant"
      className="absolute left-0 top-0 w-3 h-full z-[10050] cursor-ew-resize flex items-center justify-center group"
      onPointerDown={onPointerDown}
    >
      {/* 메인 리사이즈 핸들 */}
      <div className="w-1 h-16 bg-gray-300 rounded-full transition-all duration-200 group-hover:w-1.5 group-hover:bg-gray-500 group-hover:h-20 group-hover:shadow-lg group-hover:shadow-gray-500/20" />
      
      {/* 상단 점들 */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-1 h-1 bg-gray-400 rounded-full" />
        <div className="w-1 h-1 bg-gray-400 rounded-full" />
        <div className="w-1 h-1 bg-gray-400 rounded-full" />
      </div>
      
      {/* 하단 점들 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-1 h-1 bg-gray-400 rounded-full" />
        <div className="w-1 h-1 bg-gray-400 rounded-full" />
        <div className="w-1 h-1 bg-gray-400 rounded-full" />
      </div>
    </div>
  )
}