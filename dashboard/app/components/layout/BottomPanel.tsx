'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';

interface BottomPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    externalId: string;
    children: React.ReactNode;
}

export default function BottomPanel({ isOpen, onClose, title, externalId, children }: BottomPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const t = useTranslations();

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="flex flex-col h-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium">{externalId}: {title}</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
                {children}
            </div>
        </div>
    );
} 