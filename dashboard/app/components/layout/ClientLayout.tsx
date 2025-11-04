'use client';

import { useEffect, useState } from 'react';
import LayoutWithSidebar from './LayoutWithSidebar';
import { useAssistant } from '../../providers/assistant-store';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { toggle: toggleAssistant } = useAssistant();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 전역 단축키 추가 보장 (모든 페이지에서 동작)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + / 단축키로 Assistant 토글
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        toggleAssistant();
      }
    };

    // 여러 레벨에서 이벤트 리스너 등록
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.body.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [toggleAssistant]);

  if (!mounted) {
    return null;
  }

  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
} 