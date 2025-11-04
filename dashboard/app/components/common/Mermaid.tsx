"use client";

import React, { useEffect, useId } from 'react';
import mermaid from 'mermaid';

let initialized = false;

type MermaidProps = {
  code: string;
  className?: string;
};

export default function Mermaid({ code, className }: MermaidProps) {
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: { htmlLabels: false, wrap: true, curve: 'basis' },
        themeVariables: {
          primaryColor: '#141926',
          primaryTextColor: '#E5E7EB',
          primaryBorderColor: '#5A62F2',
          lineColor: '#5A62F2',
          secondaryColor: '#0B1020',
          tertiaryColor: '#1F2937',
          edgeLabelBackground: '#0f172a',
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
          fontSize: '14px'
        }
      });
      initialized = true;
    }

    let cancelled = false;
    const container = document.getElementById(`mmd-${id}`);
    if (!container) return;

    (async () => {
      try {
        const src = (code || '').trim();
        mermaid.parse(src);
        const { svg } = await mermaid.render(`svg-${id}`, src);
        if (!cancelled) {
          // HTML 엔티티를 디코딩하여 &amp;를 &로 변환
          const decodedSvg = svg.replace(/&amp;/g, '&');
          container.innerHTML = decodedSvg;
        }
      } catch (e) {
        if (!cancelled) {
          container.textContent = (code || '').trim();
        }
      }
    })();

    return () => { cancelled = true; };
  }, [code, id]);

  return (
    <div id={`mmd-${id}`} className={`mermaid ${className || ''}`.trim()} />
  );
}
