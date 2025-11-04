"use client";

import React from "react";
import type { useTranslations } from "next-intl";

const FONT_SIZE_OPTIONS = ["text-sm", "text-base", "text-lg", "text-xl"] as const;
export type FontSizeOption = (typeof FONT_SIZE_OPTIONS)[number];

type SettingsPanelProps = {
  t: ReturnType<typeof useTranslations>;
  panelWidth: number;
  maxWidth?: string;
  maxHeight?: string;
  fontSize: FontSizeOption;
  onFontSizeChange: (next: FontSizeOption) => void;
  opacity: number;
  onOpacityChange: (next: number) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
};

export function SettingsPanel({
  t,
  panelWidth,
  maxWidth = "calc(90vw - 50px)",
  maxHeight = "50vh",
  fontSize,
  onFontSizeChange,
  opacity,
  onOpacityChange,
  onMouseDown,
}: SettingsPanelProps) {
  const fontSizeIndex = FONT_SIZE_OPTIONS.indexOf(fontSize);
  const clampedFontSizeIndex = fontSizeIndex >= 0 ? fontSizeIndex : 1;

  const fontTrackPercent = (clampedFontSizeIndex / (FONT_SIZE_OPTIONS.length - 1)) * 100;
  const fontSliderBackground = `linear-gradient(to right, #1CCA5D ${fontTrackPercent}%, #e5e7eb ${fontTrackPercent}%)`;

  const opacityMin = 0.1;
  const opacityMax = 1.0;
  const normalizedOpacity = (opacity - opacityMin) / (opacityMax - opacityMin);
  const opacityPercent = Math.max(0, Math.min(100, Math.round(normalizedOpacity * 100)));
  const opacitySliderBackground = `linear-gradient(to right, #1CCA5D ${opacityPercent}%, #e5e7eb ${opacityPercent}%)`;

  return (
    <div
      data-settings-panel
      className="absolute top-2 z-50 rounded-lg shadow-lg overflow-hidden min-w-0"
      style={{
        width: `${Math.max(220, Math.round(panelWidth))}px`,
        maxWidth,
        maxHeight,
        left: "auto",
        right: "24px",
        background: "#141926",
        border: "1px solid rgba(88, 46, 242, 0.3)",
      }}
      onMouseDown={onMouseDown}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(88, 46, 242, 0.15)" }}
      >
        <div className="font-semibold text-white truncate">
          {t("settings.title", { default: "설정" })}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(40vh-60px)]">
        <div className="p-4">
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-sm font-medium text-white mb-2">
                {t("settings.fontSize", { default: "글씨 크기" })}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <input
                    id="font-size-slider"
                    name="fontSize"
                    type="range"
                    min={0}
                    max={FONT_SIZE_OPTIONS.length - 1}
                    step={1}
                    value={clampedFontSizeIndex}
                    onChange={(event) => {
                      const nextIndex = Number(event.target.value);
                      const option = FONT_SIZE_OPTIONS[nextIndex] ?? FONT_SIZE_OPTIONS[clampedFontSizeIndex];
                      onFontSizeChange(option);
                    }}
                    className="w-full h-2 rounded-lg appearance-none"
                    aria-label={t("settings.fontSizeAria", { default: "글씨 크기" })}
                    style={{ background: fontSliderBackground }}
                  />
                  <div className="flex justify-between text-xs text-[#BFCAD9] mt-1 px-1">
                    <div className="text-center flex-1">
                      {t("settings.sizeSmall", { default: "작게" })}
                    </div>
                    <div className="text-center flex-1">
                      {t("settings.sizeNormal", { default: "보통" })}
                    </div>
                    <div className="text-center flex-1">
                      {t("settings.sizeLarge", { default: "크게" })}
                    </div>
                    <div className="text-center flex-1">
                      {t("settings.sizeXL", { default: "매우 크게" })}
                    </div>
                  </div>
                </div>
                <div className="w-16 sm:w-20 text-center flex-shrink-0">
                  <div className={`${fontSize} font-semibold`}>Aa</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-white mb-2">
                {t("settings.opacity", { default: "투명도" })}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <input
                    id="opacity-slider"
                    name="opacity"
                    type="range"
                    min={opacityMin}
                    max={opacityMax}
                    step={0.01}
                    value={opacity}
                    onChange={(event) => onOpacityChange(Number(event.target.value))}
                    className="w-full h-2 rounded-lg appearance-none"
                    aria-label={t("settings.opacityAria", { default: "투명도" })}
                    style={{ background: opacitySliderBackground }}
                  />
                </div>
                <div className="w-12 text-right text-xs text-[#BFCAD9] flex-shrink-0">
                  {Math.round(opacity * 100)}%
                </div>
              </div>
            </div>

            <div
              className="pt-1 border-t"
              style={{ borderTop: "1px solid rgba(88, 46, 242, 0.15)" }}
            >
              <div className="text-xs text-[#BFCAD9]">
                {t("settings.preview", { default: "미리보기" })}
              </div>
              <div
                className="mt-2 p-2 rounded"
                style={{ opacity, background: "rgba(88, 46, 242, 0.08)", border: "1px solid rgba(88, 46, 242, 0.15)" }}
              >
                <div className={`${fontSize} text-white`}>
                  {t("settings.previewSample", { default: "샘플 텍스트: Assistant 입력 미리보기" })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
