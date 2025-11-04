"use client";
import { useEffect, useState } from "react";

const hasVisible = (el: Element | null) => {
  if (!el) return false;
  const anyEl = el as HTMLElement;
  return !!(anyEl.offsetParent !== null || anyEl.getClientRects().length);
};

export default function useAssistantOpen() {
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const evalOpen = () => {
      try {
        const byDom =
          hasVisible(document.querySelector("#assistant-header-slot")) ||
          hasVisible(document.querySelector("#assistant-slot")) ||
          hasVisible(document.querySelector("[data-assistant-panel]")) ||
          hasVisible(document.querySelector(".assistant-panel"));
        const byLs = typeof window !== "undefined" && window.localStorage.getItem("CHATBOT_DOCKED") === "1";
        const byData = typeof document !== "undefined" && 
          ((document.body.dataset as any)?.sidecar === "open" || 
           (document.documentElement.getAttribute("data-sidecar") === "right-open"));
        setOpen(Boolean(byDom || byLs || byData));
      } catch (error) {
        // 에러 발생 시 안전하게 false로 설정
        setOpen(false);
      }
    };

    evalOpen();

    const observer = new MutationObserver(() => evalOpen());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-sidecar", "style", "class"],
    });

    // document.documentElement도 관찰
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-sidecar"],
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === "CHATBOT_DOCKED") evalOpen();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return open;
}
