import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default function Home() {
  const acceptLang = headers().get('accept-language');
  let locale = 'ko'; // 기본값

  if (acceptLang) {
    if (acceptLang.startsWith('en')) {
      locale = 'en';
    } else if (acceptLang.startsWith('ko')) {
      locale = 'ko';
    }
  }

  redirect(`/${locale}`);
} 