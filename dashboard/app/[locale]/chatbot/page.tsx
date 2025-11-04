import { getTranslations } from 'next-intl/server';
import ClientOpener from './components/ClientOpener';

export default async function Page() {
  const t = await getTranslations('chatbot');
  return (
    <ClientOpener />
  );
}
