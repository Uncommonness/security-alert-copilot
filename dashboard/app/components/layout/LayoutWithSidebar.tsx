'use client';

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen" style={{ background: '#141926' }}>
      {children}
    </div>
  );
} 