"use client";

import React from "react";
import { format } from "date-fns";
import type { useTranslations } from "next-intl";

import Pagination from "../common/Pagination";
import {
  ConversationSummary,
  DeleteModalState,
  EditModalState,
} from "./types";

type HistoryPanelProps = {
  t: ReturnType<typeof useTranslations>;
  panelWidth: number;
  maxWidth?: string;
  maxHeight?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  total: number;
  page: number; // 1-based
  pageSize: number;
  pageSizeOptions: number[];
  loading: boolean;
  conversations: ConversationSummary[];
  onSelectConversation: (conversation: ConversationSummary) => void;
  onEditConversation: (conversation: ConversationSummary) => void;
  onDeleteConversation: (conversation: ConversationSummary) => void;
  onChangePageSize: (size: number) => void;
  onPageChange: (pageZeroBased: number) => void;
  editModal: EditModalState;
  onEditModalClose: () => void;
  onEditModalChange: (title: string) => void;
  onEditSubmit: () => Promise<void> | void;
  editSaving: boolean;
  editError: string | null;
  deleteModal: DeleteModalState;
  onDeleteModalClose: () => void;
  onDeleteConfirm: () => Promise<void> | void;
  deleteLoading: boolean;
  deleteError: string | null;
};

export function HistoryPanel({
  t,
  panelWidth,
  maxWidth = "calc(90vw - 50px)",
  maxHeight = "50vh",
  containerRef,
  total,
  page,
  pageSize,
  pageSizeOptions,
  loading,
  conversations,
  onSelectConversation,
  onEditConversation,
  onDeleteConversation,
  onChangePageSize,
  onPageChange,
  editModal,
  onEditModalClose,
  onEditModalChange,
  onEditSubmit,
  editSaving,
  editError,
  deleteModal,
  onDeleteModalClose,
  onDeleteConfirm,
  deleteLoading,
  deleteError,
}: HistoryPanelProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  return (
    <div
      data-history-panel
      className="absolute left-3 top-2 z-50 rounded-lg shadow-lg overflow-hidden min-w-0"
      ref={containerRef}
      style={{
        width: `${Math.max(220, Math.round(panelWidth))}px`,
        maxWidth,
        maxHeight,
        background: "#141926",
        border: "1px solid rgba(88, 46, 242, 0.3)",
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(88, 46, 242, 0.15)" }}
      >
        <div className="font-semibold text-white truncate">
          {t("historyTitle")}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-xs text-[#BFCAD9] font-medium whitespace-nowrap">
            {total} {t("historyItems")}
          </div>
          <select
            id="history-page-size"
            name="historyPageSize"
            value={pageSize}
            onChange={(event) => onChangePageSize(Number(event.target.value) || pageSize)}
            className="text-xs rounded-lg px-2 py-1 transition-all duration-150"
            style={{
              background: "rgba(88, 46, 242, 0.1)",
              border: "1px solid rgba(88, 46, 242, 0.3)",
              color: "#ffffff"
            }}
            aria-label={t("pageSize", { default: "페이지 크기" })}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size} style={{ background: "#141926", color: "#ffffff" }}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(40vh-60px)]">
        {loading ? (
          <div className="text-sm text-[#BFCAD9] p-3">
            {t("loading")}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-sm text-[#BFCAD9] p-3">
            {t("historyEmpty")}
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                role="button"
                tabIndex={0}
                className="text-left p-3 rounded cursor-pointer transition-all duration-150 break-words overflow-wrap-anywhere"
                style={{
                  background: "rgba(88, 46, 242, 0.05)",
                  border: "1px solid rgba(88, 46, 242, 0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.15)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.05)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.2)"
                }}
                onClick={() => onSelectConversation(conversation)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectConversation(conversation);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white break-words overflow-wrap-anywhere">
                      {conversation.title || t("historyNoTitle")}
                    </div>
                    <div className="text-xs text-[#BFCAD9] mt-1">
                      {format(new Date(conversation.updatedTimeMs), "yyyy-MM-dd HH:mm")}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1 flex-shrink-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded transition-all duration-150"
                      style={{
                        background: "rgba(88, 46, 242, 0.15)",
                        border: "1px solid rgba(88, 46, 242, 0.3)",
                        color: "#BFCAD9"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(88, 46, 242, 0.25)"
                        e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.5)"
                        e.currentTarget.style.color = "#ffffff"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(88, 46, 242, 0.15)"
                        e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.3)"
                        e.currentTarget.style.color = "#BFCAD9"
                      }}
                      aria-label={t("edit", { default: "편집" })}
                      title={t("edit", { default: "편집" })}
                      onClick={() => onEditConversation(conversation)}
                    >
                      {t("edit", { default: "편집" })}
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded transition-all duration-150"
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#fca5a5"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)"
                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)"
                        e.currentTarget.style.color = "#ef4444"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)"
                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)"
                        e.currentTarget.style.color = "#fca5a5"
                      }}
                      aria-label={t("delete", { default: "삭제" })}
                      title={t("delete", { default: "삭제" })}
                      onClick={() => onDeleteConversation(conversation)}
                    >
                      {t("delete", { default: "삭제" })}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > pageSize && (
          <div className="mt-2 px-2">
            <Pagination
              currentPage={Math.max(0, page - 1)}
              totalPages={totalPages}
              totalElements={total}
              size={pageSize}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>

      {editModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !editSaving && onEditModalClose()}
          />
          <div 
            className="relative z-[101] rounded-xl shadow-2xl w-[420px] max-w-[95vw] p-6"
            style={{
              background: "#141926",
              border: "1px solid rgba(88, 46, 242, 0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-white text-lg">
                {t("editConversation", { default: "Conversation Name" })}
              </div>
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded-lg transition-all duration-150"
                style={{
                  background: "rgba(88, 46, 242, 0.15)",
                  border: "1px solid rgba(88, 46, 242, 0.3)",
                  color: "#ffffff"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.25)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.5)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.15)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.3)"
                }}
                onClick={() => !editSaving && onEditModalClose()}
              >
                {t("close", { default: "닫기" })}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <input
                className="rounded px-3 py-2 text-sm"
                style={{
                  background: "rgba(20, 24, 38, 0.5)",
                  border: "1px solid rgba(88, 46, 242, 0.3)",
                  color: "#ffffff"
                }}
                value={editModal.title}
                onChange={(event) => onEditModalChange(event.target.value)}
                placeholder={t("enterTitle", { default: "이름을 입력하세요" })}
                autoFocus
              />
              {editError && <div className="text-xs text-red-400">{editError}</div>}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded transition-all duration-150"
                style={{
                  background: "rgba(88, 46, 242, 0.15)",
                  border: "1px solid rgba(88, 46, 242, 0.3)",
                  color: "#BFCAD9"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.25)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.5)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.15)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.3)"
                }}
                disabled={editSaving}
                onClick={onEditModalClose}
              >
                {t("cancel", { default: "취소" })}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded transition-all duration-150 disabled:opacity-50"
                style={{
                  background: "rgba(41, 242, 128, 0.2)",
                  border: "1px solid rgba(41, 242, 128, 0.4)",
                  color: "#29F280"
                }}
                onMouseEnter={(e) => {
                  if (!editSaving && editModal.title.trim()) {
                    e.currentTarget.style.background = "rgba(41, 242, 128, 0.3)"
                    e.currentTarget.style.borderColor = "rgba(41, 242, 128, 0.5)"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(41, 242, 128, 0.2)"
                  e.currentTarget.style.borderColor = "rgba(41, 242, 128, 0.4)"
                }}
                disabled={editSaving || !editModal.title.trim()}
                onClick={onEditSubmit}
              >
                {editSaving
                  ? t("saving", { default: "저장 중..." })
                  : t("save", { default: "저장" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleteLoading && onDeleteModalClose()}
          />
          <div 
            className="relative z-[101] rounded-xl shadow-2xl w-[420px] max-w-[95vw] p-4"
            style={{
              background: "#141926",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-red-400">
                {t("deleteConversation", { default: "대화 삭제" })}
              </div>
              <button
                type="button"
                className="px-2 py-1 text-xs rounded transition-all duration-150"
                style={{
                  background: "rgba(88, 46, 242, 0.15)",
                  border: "1px solid rgba(88, 46, 242, 0.3)",
                  color: "#ffffff"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.25)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.5)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.15)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.3)"
                }}
                onClick={() => !deleteLoading && onDeleteModalClose()}
              >
                {t("close", { default: "닫기" })}
              </button>
            </div>
            <div className="mb-4">
              <div className="text-sm text-[#BFCAD9] mb-2">
                {t("deleteConfirmMessage", { default: "정말로 이 대화를 삭제하시겠습니까?" })}
              </div>
              <div className="text-sm font-medium text-white">
                "{deleteModal.title || t("historyNoTitle")}" 
              </div>
              <div className="text-xs text-red-400 mt-1">
                {t("deleteWarning", { default: "이 작업은 되돌릴 수 없습니다." })}
              </div>
              {deleteError && <div className="text-xs text-red-400 mt-2">{deleteError}</div>}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded transition-all duration-150"
                style={{
                  background: "rgba(88, 46, 242, 0.15)",
                  border: "1px solid rgba(88, 46, 242, 0.3)",
                  color: "#BFCAD9"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.25)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.5)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(88, 46, 242, 0.15)"
                  e.currentTarget.style.borderColor = "rgba(88, 46, 242, 0.3)"
                }}
                disabled={deleteLoading}
                onClick={onDeleteModalClose}
              >
                {t("cancel", { default: "취소" })}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded transition-all duration-150 disabled:opacity-50"
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5"
                }}
                onMouseEnter={(e) => {
                  if (!deleteLoading) {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)"
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)"
                    e.currentTarget.style.color = "#ef4444"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)"
                  e.currentTarget.style.color = "#fca5a5"
                }}
                disabled={deleteLoading}
                onClick={onDeleteConfirm}
              >
                {deleteLoading
                  ? t("deleting", { default: "삭제 중..." })
                  : t("delete", { default: "삭제" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
