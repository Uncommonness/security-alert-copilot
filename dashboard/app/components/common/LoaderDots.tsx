"use client"
import React from 'react'

export default function LoaderDots({ className }: { className?: string }) {
  return (
    <div 
      className={`px-4 py-2 rounded-2xl shadow ${className || ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(88, 46, 242, 0.2) 0%, rgba(69, 26, 210, 0.15) 100%)',
        border: '1px solid rgba(88, 46, 242, 0.4)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 8px rgba(88, 46, 242, 0.15)',
      }}
    >
      <span className="ai-typing" aria-live="polite" aria-label="생성 중">
        <i></i><i></i><i></i>
      </span>
    </div>
  )
}
