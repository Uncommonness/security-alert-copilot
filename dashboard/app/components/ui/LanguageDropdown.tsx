import { useRouter, usePathname } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Button from './Button';

export default function LanguageDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocale = pathname.split('/')[1] === 'en' ? 'en' : 'ko';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (locale: string) => {
    // 챗봇 상태를 저장한 후 언어 변경
    try {
      // 현재 챗봇 상태를 저장하는 이벤트 발생
      window.dispatchEvent(new CustomEvent('chatbot:saveState'));
    } catch (e) {
      // 이벤트 발생 실패 시 무시
    }
    
    router.push(`/${locale}${pathname.slice(3)}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="transparent"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        tooltip={t('navbar.change_language')}
        className="w-20 min-w-[100px]"
      >
{currentLocale === 'ko' ? t('common.korean') : t('common.english')}
        <span className="ml-1 text-sm">▼</span>
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50">
          <button
            onClick={() => handleLanguageChange('ko')}
            className={`w-full px-4 py-2 text-left text-base hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              currentLocale === 'ko' ? 'text-primary font-bold' : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            {t('common.korean')}
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`w-full px-4 py-2 text-left text-base hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              currentLocale === 'en' ? 'text-primary font-bold' : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            {t('common.english')}
          </button>
        </div>
      )}
    </div>
  );
} 