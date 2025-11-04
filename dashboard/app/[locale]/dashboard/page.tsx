'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ShieldCheckmark24Regular, Document24Regular, Sparkle24Regular } from '@fluentui/react-icons';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: '#141926' }}>
      {/* 배경 그리드 패턴 */}
      <div className="absolute inset-0 dashboard-grid-pattern opacity-30"></div>
      
      {/* 3D 글로우 효과 요소들 */}
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
      <div className="relative z-10 container mx-auto px-8 py-16">
        {/* 메인 타이틀 */}
        <div className="mb-20">
          <h1 className="text-7xl font-black mb-6 dashboard-text-3d tracking-tight" style={{ color: '#ffffff' }}>
            {t('welcome')}
          </h1>
          <p className="text-3xl font-light dashboard-gradient-text-subtle">
            {t('subtitle')}
          </p>
        </div>

        {/* 문제 설명 카드 */}
        <div className="mb-12">
          <div className="dashboard-glass-card rounded-3xl p-12">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(88, 46, 242, 0.15)' }}>
                <Sparkle24Regular className="w-8 h-8" style={{ color: '#592EF2' }} />
              </div>
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-4 text-white">{t('features_title')}</h2>
                <p className="text-lg text-[#BFCAD9] leading-relaxed">
                  {t('description1')} {t('description2')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* 문서 업로드 */}
          <div className="dashboard-glass-card rounded-3xl p-8 transition-all duration-300" style={{ border: 'none' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(88, 46, 242, 0.15)' }}>
                <Document24Regular className="w-8 h-8 text-[#592EF2]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t('features.document_upload')}
              </h3>
              <p className="text-[#BFCAD9] text-sm leading-relaxed">
                {t('features_desc.document_upload')}
              </p>
            </div>
          </div>

          {/* RAG QA */}
          <div className="dashboard-glass-card rounded-3xl p-8 transition-all duration-300" style={{ border: 'none' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(41, 242, 128, 0.15)' }}>
                <ShieldCheckmark24Regular className="w-8 h-8 text-[#29F280]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t('features.rag_qa')}
              </h3>
              <p className="text-[#BFCAD9] text-sm leading-relaxed">
                {t('features_desc.rag_qa')}
              </p>
            </div>
          </div>

          {/* 지능형 검색 */}
          <div className="dashboard-glass-card rounded-3xl p-8 transition-all duration-300" style={{ border: 'none' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(88, 46, 242, 0.15)' }}>
                <Sparkle24Regular className="w-8 h-8 text-[#592EF2]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {t('features.intelligent_search')}
              </h3>
              <p className="text-[#BFCAD9] text-sm leading-relaxed">
                {t('features_desc.intelligent_search')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="dashboard-glass-card rounded-3xl p-12" style={{ border: 'none' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-5xl font-black mb-4 text-white">
                {t('quick_start')}
              </h2>
              <p className="text-xl text-[#BFCAD9]">
                {t('description1')}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/documents')}
                className="px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 hover:opacity-90"
                style={{ 
                  background: 'linear-gradient(135deg, #592EF2 0%, #29F280 100%)',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(88, 46, 242, 0.3)'
                }}
              >
                {t('upload_document')}
              </button>
              <button
                onClick={() => router.push('/chatbot')}
                className="px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 text-white hover:opacity-90"
                style={{ 
                  background: 'rgba(88, 46, 242, 0.2)',
                  border: '1px solid rgba(88, 46, 242, 0.3)'
                }}
              >
                {t('start_chat')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
