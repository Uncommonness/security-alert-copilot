"use client";
import React from "react";
import { SettingsRegular } from "@fluentui/react-icons";

/**
 * 접근성, 포커스, 호버/액티브 상태까지 깔끔하게 처리한 "설정"(톱니바퀴) 버튼
 * - 클릭 시 글로벌 이벤트 `chatbot:toggleSettings` 발행 (원래 코드와 동일한 동작)
 * - Fluent UI 아이콘 사용 → 선명하고 일관된 톱니바퀴 모양
 * - Tailwind 스타일: hover/focus/active 상태, 다크UI에 자연스러운 대비
 */

type Props = {
  /** 추가 onClick 로직(선택). 이벤트는 항상 함께 발행됩니다. */
  onClick?: () => void;
  /** 외부 Tailwind 클래스 확장(선택) */
  className?: string;
  /** 툴팁/제목(기본: "설정") */
  title?: string;
  /** 스크린 리더 레이블(기본: "설정") */
  ariaLabel?: string;
  /** 크기(px). 20~24 권장 */
  size?: number;
};

export default function SettingsButton({
  onClick,
  className = "",
  title = "설정",
  ariaLabel = "설정",
  size = 20,
}: Props) {
  const handleClick = () => {
    onClick?.();
    // 전역 이벤트 발행(보안 대시보드의 설정 패널 토글 등)
    window.dispatchEvent(new CustomEvent("chatbot:toggleSettings"));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      aria-label={ariaLabel}
      data-settings-button
      className={[
        "group inline-flex items-center justify-center",
        "rounded-xl p-2",
        // 색/상태
        "text-white/90 hover:text-white",
        "hover:bg-white/10",
        // 접근성: 포커스 링
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        // 클릭 피드백
        "active:scale-95",
        // 부드러운 트랜지션
        "transition duration-150",
        className,
      ].join(" ")}
    >
      <SettingsRegular
        aria-hidden
        style={{ width: size, height: size }}
        className="pointer-events-none group-hover:animate-spin"
      />
      {/* 보조 레이블(스크린 리더용) */}
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
}

/**
 * 사용 예시
 *
 * <SettingsButton />
 * <SettingsButton size={22} className="ml-1" />
 * <SettingsButton onClick={() => console.log('open settings')} />
 */
