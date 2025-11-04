"use client"
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { copyToClipboard as utilCopyToClipboard } from '@/lib/clipboard'
import { useRouter } from 'next/navigation'

type Props = {
  children: string
}

export default function MarkdownRenderer({ children }: Props) {
  const router = useRouter()

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // 내부 링크인지 확인 (같은 도메인 또는 상대 경로)
    if (href.startsWith('/') || href.includes(window.location.hostname)) {
      e.preventDefault()
      router.push(href)
    }
    // 외부 링크는 기본 동작 유지 (새 탭에서 열기)
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-white mb-3 font-bold text-xl" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-white mb-2.5 font-bold text-lg" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-white mb-2 font-semibold text-base" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="text-white mb-2 font-semibold" {...props} />
        ),
        h5: ({ node, ...props }) => (
          <h5 className="text-white mb-2 font-medium" {...props} />
        ),
        h6: ({ node, ...props }) => (
          <h6 className="text-white mb-2 font-medium text-sm" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="text-white/90 mb-2" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="text-white/90 mb-3 ml-5 list-disc" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="text-white/90 mb-3 ml-5 list-decimal" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="text-white/90 mb-1" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote 
            className="border-l-4 border-[#592EF2] pl-4 my-3 italic text-white/80"
            style={{ borderLeftColor: '#592EF2' }}
            {...props} 
          />
        ),
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table 
              className="min-w-full border-collapse rounded-lg overflow-hidden shadow-lg" 
              style={{ 
                border: '1px solid rgba(88, 46, 242, 0.3)',
                background: 'rgba(88, 46, 242, 0.05)'
              }}
              {...props} 
            />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead style={{ background: 'rgba(88, 46, 242, 0.15)' }} {...props} />
        ),
        tbody: ({ node, ...props }) => (
          <tbody style={{ background: 'rgba(88, 46, 242, 0.05)' }} {...props} />
        ),
        th: ({ node, ...props }) => (
          <th 
            className="px-4 py-3 text-left font-bold" 
            style={{ 
              border: '1px solid rgba(88, 46, 242, 0.3)',
              color: '#ffffff'
            }}
            {...props} 
          />
        ),
        td: ({ node, ...props }) => (
          <td 
            className="px-4 py-3 align-top" 
            style={{ 
              border: '1px solid rgba(88, 46, 242, 0.3)',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
            {...props} 
          />
        ),
        tr: ({ node, ...props }) => (
          <tr 
            className="transition-colors duration-150" 
            style={{ borderBottom: '1px solid rgba(88, 46, 242, 0.2)' }}
            {...props} 
          />
        ),
        code: ({ node, inline, className, children, ...props }) => {
          const codeText = String(children).replace(/\n$/, "")
          const langMatch = (className || "").match(/language-(\w+)/)
          const lang = langMatch ? langMatch[1] : ""
          if (inline) {
            return (
              <code 
                className="px-2 py-1 rounded-md font-mono text-sm border" 
                style={{
                  background: 'rgba(88, 46, 242, 0.2)',
                  color: '#BFCAD9',
                  borderColor: 'rgba(88, 46, 242, 0.4)'
                }}
                {...props}
              >
                {children}
              </code>
            )
          }
          return (
            <div className="relative my-4 rounded-lg overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(88, 46, 242, 0.15)' }}>
              <div className="absolute right-3 top-3 flex items-center gap-2 z-10">
                {lang ? (
                  <span 
                    className="text-xs px-2 py-1 rounded-md font-medium" 
                    style={{
                      background: 'rgba(20, 24, 38, 0.95)',
                      color: '#BFCAD9',
                      border: '1px solid rgba(88, 46, 242, 0.4)'
                    }}
                  >
                    {lang}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded-md transition-colors duration-150"
                  style={{
                    background: 'rgba(20, 24, 38, 0.95)',
                    color: '#BFCAD9',
                    border: '1px solid rgba(88, 46, 242, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(88, 46, 242, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(20, 24, 38, 0.95)'
                  }}
                  onClick={async () => {
                    try { await utilCopyToClipboard(codeText) } catch (e) {}
                  }}
                >
                  Copy
                </button>
              </div>
              <pre 
                className="p-4 overflow-auto rounded-lg"
                style={{
                  background: 'rgba(20, 24, 38, 0.8)',
                  color: '#BFCAD9',
                  border: '1px solid rgba(88, 46, 242, 0.3)'
                }}
              >
                <code className={className} {...props}>{children}</code>
              </pre>
            </div>
          )
        },
        a: ({ node, href, children, ...props }) => (
          <a
            href={href}
            onClick={(e) => href && handleLinkClick(e, href)}
            className="inline-flex items-center gap-1 font-medium transition-all duration-200 px-1 py-0.5 rounded-md"
            style={{
              color: '#29F280',
              background: 'rgba(41, 242, 128, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#29F280'
              e.currentTarget.style.background = 'rgba(41, 242, 128, 0.2)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(41, 242, 128, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#29F280'
              e.currentTarget.style.background = 'rgba(41, 242, 128, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            {...props}
          >
            {children}
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="inline-block ml-0.5 opacity-70"
            >
              <path 
                d="M7 17L17 7M17 7H7M17 7V17" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </a>
        ),
      }}
    >
      {String(children || '')}
    </ReactMarkdown>
  )
}
