'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ShieldCheckmark24Regular, Document24Regular, LinkSquare24Regular, Sparkle24Regular } from '@fluentui/react-icons';
import FloatingNav from '../components/common/FloatingNav';

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations('home');

  // Tutorial chat sequence (reference: HoverAssistantHint)
  type Msg = { id: string; role: 'assistant' | 'user'; text: string };
  const messagesSeed: Msg[] = useMemo(() => ([
    { id: 'm1', role: 'assistant', text: t('tutorialMessages.m1') },
    { id: 'm2', role: 'user', text: t('tutorialMessages.m2') },
    { id: 'm3', role: 'assistant', text: t('tutorialMessages.m3') },
    { id: 'm4', role: 'user', text: t('tutorialMessages.m4') },
    { id: 'm5', role: 'assistant', text: t('tutorialMessages.m5') },
  ]), [t]);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const timersRef = useRef<number[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Progress animation
  useEffect(() => {
    let progress = 0;
    const duration = 3000; // 3 seconds
    const increment = 100 / (duration / 16); // Update every frame (60fps)
    
    const progressTimer = setInterval(() => {
      progress += increment;
      if (progress > 100) {
        progress = 100;
        clearInterval(progressTimer);
      }
      setProgressPercent(Math.floor(progress));
    }, 16);
    
    return () => clearInterval(progressTimer);
  }, []);

  useEffect(() => {
    setVisibleIds([]);
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    const baseDelay = 600;
    const step = 900;
    messagesSeed.forEach((m, i) => {
      const id = window.setTimeout(() => {
        setVisibleIds((prev) => (prev.includes(m.id) ? prev : [...prev, m.id]));
        setTimeout(() => {
          if (chatContainerRef.current) {
            const el = chatContainerRef.current;
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
          }
        }, 100);
      }, baseDelay + i * step);
      timersRef.current.push(id);
    });
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [messagesSeed]);

  const navigationCards = [
    {
      icon: <LinkSquare24Regular />,
      title: t('arch_title'),
      description: t('arch_description'),
      href: '/architecture',
      gradient: 'from-purple-500 to-green-400'
    },
    {
      icon: <Sparkle24Regular />,
      title: t('agent_title'),
      description: t('agent_description'),
      href: '/chatbot',
      gradient: 'from-pink-500 to-purple-400'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#141926' }}>
      {/* FloatingNav를 페이지 내부로 이동 */}
      <FloatingNav />
      
      {/* 배경 효과 */}
      <div className="absolute inset-0 dashboard-grid-pattern opacity-30"></div>
      <div className="absolute top-20 left-10 w-64 h-64 dashboard-glow" style={{ 
        background: 'radial-gradient(circle, #592EF2 0%, transparent 70%)',
        transform: 'translate3d(0,0,0)'
      }}></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 dashboard-glow" style={{ 
        background: 'radial-gradient(circle, #29F280 0%, transparent 70%)',
        transform: 'translate3d(0,0,0)',
        animationDelay: '1.5s'
      }}></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 w-full max-w-7xl px-4 md:px-8 py-10 md:py-20" style={{ marginTop: '60px' }}>
        {/* 메인 타이틀 */}
        <div className="flex items-center justify-center mb-8 md:mb-12">
          {/* Title Text */}
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-9xl font-black mb-4 md:mb-6 dashboard-text-3d tracking-tight" style={{ color: '#ffffff' }}>
            {t('title')}
          </h1>
          <p className="text-lg md:text-2xl lg:text-3xl font-light dashboard-gradient-text-subtle px-4">
            {t('subtitle')}
          </p>
          </div>
        </div>

        {/* 노트북 목업 - 평면 디자인 */}
        <div className="flex justify-center mt-6 md:mt-12 mb-20 md:mb-40">
          <div className="relative w-full px-2 md:px-0" style={{ maxWidth: '1500px' }}>
            {/* 전체 노트북 컨테이너 - 평면으로 */}
            <div className="relative">
              {/* 화면 본체 */}
              <div className="relative mx-auto overflow-hidden" style={{ 
                width: '100%',
                height: 'auto',
                aspectRatio: '16/10',
                background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 50%, #d8d8d8 100%)',
                borderRadius: '12px',
                border: '6px solid rgba(0,0,0,0.08)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
              }}>
                {/* Bezel wrapper with padding; content inside to avoid dimming */}
                <div className="absolute inset-0 z-10" style={{
                  padding: '10px',
                  background: 'rgba(30, 30, 30, 0.95)',
                  borderRadius: '10px',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)'
                }}>
                  {/* 화면 콘텐츠 */}
                  <div className="relative w-full h-full overflow-hidden rounded" style={{ background: 'radial-gradient(1200px 600px at 20% 20%, rgba(88,46,242,0.18), transparent), radial-gradient(900px 500px at 80% 60%, rgba(41,242,128,0.12), transparent), #0d1117' }}>
                  {/* 카메라 홈 */}
                    <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-24 h-2 rounded-full" style={{
                    background: 'rgba(15,15,15,0.95)',
                    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.9)'
                  }}></div>
                    <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-12">
                    {/* Left: Tutorial steps (glass cards) */}
                    <div className="col-span-1 md:col-span-7 px-4 md:px-10 py-4 md:py-9 space-y-4 md:space-y-7">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <span className="text-xs md:text-base text-gray-300 tracking-wide">{t('appName')}</span>
                        <span className="inline-block w-1 h-1 rounded-full bg-gray-500"></span>
                        <span className="text-xs md:text-base text-gray-300">{t('appTagline')}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold dashboard-gradient-text-subtle">{t('analysisTitle')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
                        <div className="dashboard-glass-card rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/10 hover:translate-y-[-2px] transition-all" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="text-xs md:text-sm text-gray-300 mb-1">Detection-Aware</div>
                          <div className="text-white text-base md:text-lg font-semibold mb-2">{t('detectionAware')}</div>
                          <div className="text-gray-300 text-sm md:text-base">{t('detectionDesc')}</div>
                        </div>
                        <div className="dashboard-glass-card rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/10 hover:translate-y-[-2px] transition-all" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="text-xs md:text-sm text-gray-300 mb-1">RAG-Grounded</div>
                          <div className="text-white text-base md:text-lg font-semibold mb-2">{t('ragGrounded')}</div>
                          <div className="text-gray-300 text-sm md:text-base">{t('ragDesc')}</div>
                        </div>
                        <div className="dashboard-glass-card rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/10 hover:translate-y-[-2px] transition-all" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="text-xs md:text-sm text-gray-300 mb-1">{t('humanInLoop')}</div>
                          <div className="text-white text-base md:text-lg font-semibold mb-2">{t('actionableSteps')}</div>
                          <div className="text-gray-300 text-sm md:text-base">{t('actionableStepsDesc')}</div>
                        </div>
                </div>
                
                      {/* Animated progress */}
                      <div className="mt-4">
                        <div className="h-2 w-full rounded-full overflow-hidden bg-white/10">
                          <div 
                            className="h-full relative rounded-full transition-all duration-[3000ms] ease-out" 
                            style={{ 
                              width: '0%',
                              background: 'linear-gradient(90deg, #592EF2, #29F280)',
                              animation: 'progressFill 3s ease-out forwards'
                            }}
                          >
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0.3) 20%, transparent 20%), linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.3) 40%, transparent 60%), linear-gradient(120deg, transparent 60%, rgba(255,255,255,0.3) 60%, transparent 80%)', backgroundSize: '40px 100%', animation: 'progressShimmer 1.6s linear infinite' }}></div>
                          </div>
                        </div>
                        <div className="text-gray-300 text-base mt-2">{t('progressLabel')}: {progressPercent}%</div>
                      </div>
                    </div>
                    
                    {/* Right: Assistant preview panel (matching real UI) */}
                    <div className="col-span-1 md:col-span-5 h-full flex flex-col relative md:border-t-0" style={{ background: '#141926', borderLeft: '1px solid rgba(88,46,242,0.3)', borderTop: '1px solid rgba(88,46,242,0.3)' }}>
                      {/* Resizer indicator (thin line on left) */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 z-50 cursor-ew-resize" style={{ background: 'rgba(88,46,242,0.4)', opacity: 0, transition: 'opacity 0.2s' }}>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-lg" style={{ background: '#592EF2' }}></div>
                      </div>
                  
                      {/* Header */}
                      <div className="px-6 py-3 flex items-center justify-between" style={{ background: '#141926', borderBottom: '1px solid rgba(88,46,242,0.3)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#592EF2]/30 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="#592EF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                          </div>
                          <span className="text-sm font-medium text-white">{t('appName')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{t('appName')}</span>
                          <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400 border border-white/10">Ctrl + /</span>
                        </div>
                  </div>
                  
                      {/* Chat content area */}
                      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ background: '#141926', scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,100,100,0.6) rgba(20,25,38,0.7)' }}>
                        {messagesSeed.map((m) => (
                          visibleIds.includes(m.id) ? (
                            <div key={m.id} className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                              <div className={`px-4 py-3 rounded-2xl text-sm max-w-[80%] shadow-lg backdrop-blur-sm transition-all animate-[bubbleIn_0.3s_ease-out] ${
                                m.role === 'assistant' 
                                  ? 'bg-white/10 text-white border border-white/10 hover:bg-white/15' 
                                  : 'bg-[#29F280]/15 text-white border border-[#29F280]/40 hover:bg-[#29F280]/20'
                              }`}>
                                {m.text}
                              </div>
                            </div>
                          ) : null
                        ))}
                  </div>
                  
                      {/* Input area at bottom */}
                      <div className="px-6 py-4 border-t" style={{ background: '#141926', borderColor: 'rgba(88,46,242,0.3)' }}>
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(88,46,242,0.25)' }}>
                          <div className="flex-1 text-sm text-gray-400">{t('inputPlaceholder')}</div>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(88,46,242,0.2)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M22 2L11 13" stroke="#592EF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#592EF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* local keyframes */}
                  <style jsx>{`
                    @keyframes progressShimmer {
                      0% { background-position: 0 0, 0 0, 0 0; }
                      100% { background-position: 160px 0, 160px 0, 160px 0; }
                    }
                    @keyframes progressFill {
                      0% { width: 0%; }
                      50% { width: 50%; }
                      100% { width: 100%; }
                    }
                  `}</style>
                </div>
              </div>

              {/* 노트북 하단 베이스 - 평면 */}
              <div className="mx-auto relative" style={{ 
                width: '120%',
                marginLeft: '-10%',
                marginTop: '2px'
              }}>
                <div className="h-6 rounded" style={{
                  background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 50%, #d8d8d8 100%)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderTop: 'none'
                }}>
                  {/* 터치패드 인디케이터 */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-1.5 rounded-sm" style={{
                    background: 'linear-gradient(180deg, #e0e0e0 0%, #d0d0d0 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
