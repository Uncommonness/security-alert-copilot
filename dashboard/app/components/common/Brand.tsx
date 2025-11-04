'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function Brand() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ko';
  const href = `/${locale}/dashboard`;
  const t = useTranslations();

  return (
    <Link href={href} aria-label="Security Alert Copilot" className="flex items-center select-none">
      <span className="text-white text-base md:text-[18px] leading-none font-semibold">{t('title')}</span>
    </Link>
  );
}

