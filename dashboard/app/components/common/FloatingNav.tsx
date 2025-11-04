'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAssistant } from '../../providers/assistant-store';
import { useState, useRef, useEffect } from 'react';
import {
  Home24Regular,
  Document24Regular,
  LinkSquare24Regular,
  Sparkle24Regular,
} from '@fluentui/react-icons';

export default function FloatingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { isOpen: assistantOpen, toggle: toggleAssistant } = useAssistant();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLocale = pathname.split('/')[1] === 'en' ? 'en' : 'ko';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (locale: string) => {
    router.push(`/${locale}${pathname.slice(3)}`);
    setLangOpen(false);
  };

  const menuItems = [
    {
      href: `/${pathname.split('/')[1]}`,
      label: '홈',
      icon: <Home24Regular className="w-8 h-8" />,
      isActive: pathname === `/${pathname.split('/')[1]}` || pathname === `/${pathname.split('/')[1]}/`,
    },
    {
      href: `/${pathname.split('/')[1]}/architecture`,
      label: t('sidebar.architecture'),
      icon: <LinkSquare24Regular className="w-8 h-8" />,
      isActive: pathname.includes('/architecture'),
    },
  ];

  return (
    <div className="fixed top-5 left-0 right-0 z-50 px-3 flex justify-center">
      {/* 어두운 미니멀 스타일 */}
      <div
        className="rounded-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(20, 25, 38, 0.85)',
          border: '1px solid rgba(100, 100, 100, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex items-center justify-center gap-4 w-full max-w-[1280px] px-6 py-3">
          {/* Navigation buttons - grouped */}
          <div className="flex gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2.5
                  ${item.isActive 
                    ? 'bg-[rgba(88,46,242,0.2)] border border-[rgba(88,46,242,0.4)] text-white' 
                    : 'text-[rgba(191,202,217,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                  }
                `}
              >
                {React.cloneElement(item.icon as any, { 
                  className: `w-5 h-5 ${item.isActive ? 'text-[rgba(88,46,242,0.9)]' : ''}`
                })}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-8 opacity-30" style={{
            background: 'rgba(191, 202, 217, 0.3)'
          }}></div>

          {/* Right side - Language and Assistant */}
          <div className="flex items-center gap-2">
        {/* Language dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="px-4 py-2.5 rounded-xl transition-all duration-200 text-[rgba(191,202,217,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-2"
            title={currentLocale === 'ko' ? t('common.korean') : t('common.english')}
          >
            <span className="text-base" role="img" aria-label={currentLocale === 'ko' ? t('common.korean') : t('common.english')}>
              {currentLocale === 'ko' ? '🇰🇷' : '🇺🇸'}
            </span>
            <span className="text-sm font-medium">{t('common.changeLanguage')}</span>
          </button>

          {langOpen && (
            <div 
              className="absolute right-0 mt-2 rounded-xl p-2 min-w-[120px] z-50"
              style={{
                background: 'rgba(20, 25, 38, 0.95)',
                border: '1px solid rgba(100, 100, 100, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <button
                onClick={() => handleLanguageChange('ko')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center gap-2 ${
                  currentLocale === 'ko' 
                    ? 'text-white bg-[rgba(88,46,242,0.2)] border border-[rgba(88,46,242,0.4)] font-medium' 
                    : 'text-[rgba(191,202,217,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                <span>🇰🇷</span>
                <span>{t('common.korean')}</span>
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center gap-2 ${
                  currentLocale === 'en' 
                    ? 'text-white bg-[rgba(88,46,242,0.2)] border border-[rgba(88,46,242,0.4)] font-medium' 
                    : 'text-[rgba(191,202,217,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                <span>🇺🇸</span>
                <span>English</span>
              </button>
            </div>
          )}
        </div>

          {/* Assistant toggle button */}
          <button
            onClick={toggleAssistant}
            className={`
              px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2.5
              ${assistantOpen 
                ? 'bg-[rgba(88,46,242,0.2)] border border-[rgba(88,46,242,0.4)] text-white' 
                : 'text-[rgba(191,202,217,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
              }
            `}
            title="Security Alert Copilot"
            aria-label="Security Alert Copilot"
          >
            <Sparkle24Regular className={`w-5 h-5 ${assistantOpen ? 'text-[rgba(88,46,242,0.9)]' : ''}`} />
            <span className="text-sm font-medium">Copilot</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

