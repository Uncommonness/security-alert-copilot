'use client';

import { useLocale, useTranslations } from 'next-intl';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalElements,
  size,
  onPageChange,
}: PaginationProps) {
  const t = useTranslations();
  const locale = useLocale();

  // 페이지 번호 목록 생성 (최대 5개)
  const getPageNumbers = () => {
    const pageNumbers = [];
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    if (endPage - startPage < 4) {
      if (startPage === 0) {
        endPage = Math.min(4, totalPages - 1);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(0, totalPages - 5);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const renderSummaryText = () => {
    const start = currentPage * size + 1;
    const end = Math.min((currentPage + 1) * size, totalElements);
    if (locale === 'ko') {
      return `총 ${totalElements}개 중 ${start} - ${end} 항목`;
    }
    return `Showing ${start} to ${end} of ${totalElements} results`;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          {totalElements > 0 ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {renderSummaryText()}
            </p>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('pagination.no_results')}
            </p>
          )}
        </div>
        {/* 페이지 버튼은 항상 표시하되, 버튼 자체의 disabled 속성으로 제어 */}
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">{t('pagination.previous')}</span>
              &laquo;
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === pageNumber
                    ? 'z-10 bg-[#1CCA5D] border-[#1CCA5D] text-white'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {pageNumber + 1}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">{t('pagination.next')}</span>
              &raquo;
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
} 