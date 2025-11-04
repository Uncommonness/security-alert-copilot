'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  Home24Regular,
  ShieldCheckmark24Regular,
  GridKanbanRegular,
  ClockArrowDownload24Regular,
  TaskListSquareLtrRegular,
  PanelLeftHeader24Regular,
  DocumentOnePage24Regular,
  Person24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import Icons, { IconChevron } from '@/app/components/icons/Icons';

export default function Sidebar() {
  const { open, setOpen } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  type MenuItem = {
    href?: string;
    id?: string;
    label: string;
    icon: React.ReactNode;
    submenu?: MenuItem[];
  };

  const menu: MenuItem[] = [
    {
      href: `/${pathname.split('/')[1]}`,
      label: t('sidebar.home'),
      icon: <Home24Regular />,
    },
    {
      href: `/${pathname.split('/')[1]}/architecture`,
      label: t('sidebar.architecture'),
      icon: <GridKanbanRegular />,
    },
    {
      href: `/${pathname.split('/')[1]}/chatbot`,
      label: t('sidebar.chatbot'),
      icon: <ShieldCheckmark24Regular />,
    },
  ];

  const mainMenu = menu;

  // Open all submenus by default
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    const seed = [...menu];
    seed.forEach((item: any) => {
      const k = (item.id as string) || (item.href as string);
      if (item.submenu && item.submenu.length) {
        if (k) initial[k] = false; // start collapsed by default
        // also prepare keys for second-level categories
        item.submenu.forEach((sub: any) => {
          const sk = (sub.id as string) || (sub.href as string);
          if (sub.submenu && sub.submenu.length && sk) initial[sk] = false;
        });
      }
    });
    setOpenSubmenus(initial);
    // 의도적으로 빈 의존성 배열 사용: 컴포넌트 마운트 시 한 번만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* 모바일 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`text-[#BFCAD9] flex flex-col fixed left-0 z-20 transition-all duration-200 top-[56px] h-[calc(100%-56px)]
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:translate-x-0
        `}
        style={{
          width: open ? '280px' : '64px',
          maxWidth: '85vw',
          background: '#141926',
          borderRight: '1px solid rgba(88, 46, 242, 0.2)'
        }}
      >
      <nav className={`flex-1 ${open ? 'p-3' : 'py-3'} space-y-1 overflow-y-auto`}>
        {mainMenu.map((item) => {
          const { href, id, label, icon, submenu } = item;
          const itemKey = (id as string) || (href as string);
          const isActive = !!href && pathname === href;
          const hasSubmenu = !!submenu;

          return (
            <div key={itemKey}>
              <div
                className={`
                  flex items-center gap-2 rounded-lg transition cursor-pointer text-[13px]
                  ${open ? 'justify-between' : 'justify-center'}
                  hover:bg-[rgba(88,46,242,0.1)] ${isActive ? 'bg-[rgba(88,46,242,0.2)] text-[#29F280]' : ''}
                  min-h-[44px] px-2
                `}
                onClick={() => hasSubmenu && itemKey && toggleSubmenu(itemKey)}
              >
                {href ? (
                  <Link
                    href={href}
                    className={`
                      flex items-center gap-3 flex-1 pl-2 pr-3 py-2 border-l-2 ${isActive ? 'border-[#29F280]' : 'border-transparent'}
                      ${open ? 'justify-start' : 'justify-center'}
                    `}
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 text-[#BFCAD9]">
                      {icon}
                    </span>
                    {open && <span className="whitespace-nowrap text-[13px]">{label}</span>}
                  </Link>
                ) : (
                  <div
                    className={`
                      flex items-center gap-3 flex-1 pl-2 pr-3 py-2 border-l-2 border-transparent
                      ${open ? 'justify-start' : 'justify-center'}
                    `}
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 text-[#BFCAD9]">
                      {icon}
                    </span>
                    {open && <span className="whitespace-nowrap text-[13px]">{label}</span>}
                  </div>
                )}
                {hasSubmenu && open && (
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <IconChevron className={`text-[#BFCAD9] transform transition-transform ${openSubmenus[itemKey] ? 'rotate-90' : ''}`} />
                  </span>
                )}
              </div>
              {hasSubmenu && openSubmenus[itemKey] && open && (
                <div className="ml-2 mt-1 space-y-1">
                  {submenu.map((subItem) => {
                    const { href, id, label, icon, submenu: subsubmenu } = subItem;
                    const subKey = (id as string) || (href as string);
                    const isSubmenuActive = !!href && pathname === href;
                    const children = Array.isArray(subsubmenu) ? subsubmenu : [];
                    const hasSubSubmenu = children.length > 0;
                    return (
                      <div key={subKey}>
                        {href ? (
                          <Link
                            href={href}
                            className={`
                              flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg transition text-[13px] border-l-2 ${isSubmenuActive ? 'border-[#29F280] bg-[rgba(88,46,242,0.2)] text-[#29F280]' : 'border-transparent hover:bg-[rgba(88,46,242,0.1)]'}
                            `}
                          >
                            <span className="inline-flex items-center justify-center w-4 h-4 text-[#BFCAD9]">
                              {icon}
                            </span>
                            <span className="whitespace-nowrap text-[13px]">{label}</span>
                          </Link>
                        ) : (
                          <div
                            className={`
                              flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg transition text-[13px] border-l-2 border-transparent
                              w-full justify-between cursor-pointer
                            `}
                            role="button"
                            aria-expanded={!!openSubmenus[subKey]}
                            aria-controls={`submenu-${subKey}`}
                            tabIndex={0}
                            onClick={() => subKey && toggleSubmenu(subKey)}
                            onKeyDown={(e) => {
                              if (!subKey) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleSubmenu(subKey);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center justify-center w-4 h-4 text-[#BFCAD9]">
                                {icon}
                              </span>
                              <span className="whitespace-nowrap text-[13px]">{label}</span>
                            </div>
                            {
                              <span className="inline-flex items-center justify-center w-5 h-5">
                                <IconChevron className={`text-[#BFCAD9] transform transition-transform ${openSubmenus[subKey] ? 'rotate-90' : ''}`} />
                              </span>
                            }
                          </div>
                        )}
                        {hasSubSubmenu && openSubmenus[subKey] && (
                          <div id={`submenu-${subKey}`} className="ml-3 mt-1 space-y-1">
                            {children
                              .filter((item): item is MenuItem & { href: string } => !!item.href)
                              .map(({ href, label, icon }) => {
                                const isActive3 = pathname === href;
                                return (
                                  <Link
                                    key={href}
                                    href={href}
                                    className={`
                                      flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg transition text-[13px] border-l-2 ${isActive3 ? 'border-[#29F280] bg-[rgba(88,46,242,0.2)] text-[#29F280]' : 'border-transparent hover:bg-[rgba(88,46,242,0.1)]'}
                                    `}
                                  >
                                    <span className="inline-flex items-center justify-center w-4 h-4 text-[#BFCAD9]">
                                      {icon}
                                    </span>
                                    <span className="whitespace-nowrap text-[13px]">{label}</span>
                                  </Link>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* unified menu only; no drafts section */}
      </nav>
    </aside>
    </>
  );
} 