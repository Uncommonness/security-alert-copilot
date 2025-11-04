import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ThemeProvider } from '../components/common/ThemeProvider';
import { SidebarProvider } from '../contexts/SidebarContext';
import LayoutWithSidebar from '../components/layout/LayoutWithSidebar';
import ClientLayout from '../components/layout/ClientLayout';
import ClientShell from '../shell';

export default async function LocaleLayout({ children, params }: { children: React.ReactNode, params: { locale: string } }) {
  let messages;
  try {
    messages = (await import(`../../messages/${params.locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={params.locale} className="light" suppressHydrationWarning>
      <body className="bg-gray-50 text-slate-900">
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <ThemeProvider>
            <SidebarProvider>
              <ClientShell>
                <ClientLayout>{children}</ClientLayout>
              </ClientShell>
            </SidebarProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 