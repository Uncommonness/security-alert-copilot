/**
 * 텍스트 정리 및 이상 문자 제거 유틸리티
 * 서버에서 오는 응답에 포함된 이상한 문자들을 정리하여 깔끔하게 표시
 */

/**
 * 텍스트에서 이상한 문자들을 제거하고 정리하는 함수
 * @param text 정리할 텍스트
 * @returns 정리된 텍스트
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  // 1. 제어 문자 제거 (탭, 개행 문자는 유지)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. 잘못된 유니코드 문자 제거 (대체 문자, 제어 문자 등)
  sanitized = sanitized.replace(/[\uFFFD\uFEFF\u200B-\u200D\u2060]/g, '');

  // 3. 연속된 공백 정리 (단, 줄바꿈은 유지) - 보수적으로 처리
  sanitized = sanitized.replace(/[ \t]{3,}/g, '  '); // 3개 이상의 공백만 2개로 줄임

  // 4. 연속된 줄바꿈 정리 (최대 2개까지만 허용)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // 5. 문장 시작과 끝의 불필요한 공백 제거
  sanitized = sanitized.replace(/^[ \t\n]+|[ \t\n]+$/g, '');

  // 6. 특수 문자 정리 - 더 보수적으로 처리
  // 기본적인 문자, 한글, 영문, 숫자, 일반적인 문장 부호만 유지
  sanitized = sanitized.replace(/[^\w\s\u3131-\u3163\uAC00-\uD7AF\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\uFF00-\uFFEF]/g, ' ');

  // 7. 연속된 공백을 다시 정리 (보수적으로)
  sanitized = sanitized.replace(/[ \t]{2,}/g, ' ');

  // 8. 문장 부호 앞뒤 공백 정리 - 마크다운 형식 보존을 위해 제거
  // sanitized = sanitized.replace(/\s+([,.!?;:])/g, '$1');
  // sanitized = sanitized.replace(/([,.!?;:])\s+/g, '$1 ');

  // 9. 따옴표 정리 - 마크다운 형식 보존을 위해 제거
  // sanitized = sanitized.replace(/\s*[""''`]\s*/g, '"');
  // sanitized = sanitized.replace(/\s*[''`]\s*/g, "'");

  // 10. 괄호 정리 - 마크다운 형식 보존을 위해 제거
  // sanitized = sanitized.replace(/\s*[()]\s*/g, (match) => match.trim());

  // 11. 마지막 정리: 연속된 공백과 줄바꿈 정리 - 보수적으로 처리
  sanitized = sanitized.replace(/\n[ \t]{2,}/g, '\n'); // 줄바꿈 후 2개 이상의 공백만 제거
  sanitized = sanitized.replace(/[ \t]{2,}\n/g, '\n'); // 2개 이상의 공백 후 줄바꿈만 제거

  return sanitized.trim();
}

/**
 * 마크다운 텍스트를 정리하는 함수
 * @param markdown 정리할 마크다운 텍스트
 * @returns 정리된 마크다운 텍스트
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  let sanitized = markdown;

  // 1. 기본 텍스트 정리 (보수적으로)
  sanitized = sanitizeText(sanitized);

  // 2. 마크다운 특수 문자 정리 - 최소한만 처리
  // 헤더 마커 정리 (과도한 공백만 제거)
  sanitized = sanitized.replace(/^#{1,6}\s{2,}/gm, (match) => {
    const level = match.match(/#+/)?.[0].length || 1;
    return '#'.repeat(level) + ' ';
  });
  
  // 리스트 마커 정리 (과도한 공백만 제거)
  sanitized = sanitized.replace(/^[\s]*[-*+]\s{2,}/gm, (match) => {
    const marker = match.match(/[-*+]/)?.[0] || '-';
    return marker + ' ';
  });
  
  // 번호 리스트 정리 (과도한 공백만 제거)
  sanitized = sanitized.replace(/^[\s]*\d+\.\s{2,}/gm, (match) => {
    const number = match.match(/\d+/)?.[0] || '1';
    return number + '. ';
  });

  // 3. 연속된 줄바꿈 정리 (마크다운에서는 최대 2개)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  return sanitized.trim();
}

/**
 * HTML 텍스트를 정리하는 함수
 * @param html 정리할 HTML 텍스트
 * @returns 정리된 HTML 텍스트
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // 1. HTML 태그 내부의 텍스트만 정리
  sanitized = sanitized.replace(/>([^<]+)</g, (match, text) => {
    return '>' + sanitizeText(text) + '<';
  });

  // 2. HTML 태그 정리
  sanitized = sanitized.replace(/<[^>]*>/g, (match) => {
    // 태그 내부의 공백 정리
    return match.replace(/\s+/g, ' ').trim();
  });

  // 3. 연속된 공백 정리
  sanitized = sanitized.replace(/\s+/g, ' ');

  // 4. 태그 사이의 공백 정리
  sanitized = sanitized.replace(/>\s+</g, '><');

  return sanitized.trim();
}

/**
 * 텍스트 타입에 따라 적절한 정리 함수를 선택하는 함수
 * @param text 정리할 텍스트
 * @param contentType 텍스트 타입 ('text', 'markdown', 'html')
 * @returns 정리된 텍스트
 */
export function sanitizeByContentType(text: string, contentType: string = 'text'): string {
  switch (contentType.toLowerCase()) {
    case 'markdown':
      return sanitizeMarkdown(text);
    case 'html':
      return sanitizeHtml(text);
    case 'text':
    default:
      return sanitizeText(text);
  }
}

/**
 * 텍스트가 정리가 필요한지 확인하는 함수
 * @param text 확인할 텍스트
 * @returns 정리가 필요한지 여부
 */
export function needsSanitization(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // 제어 문자나 이상한 유니코드 문자가 있는지 확인
  const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text);
  const hasInvalidUnicode = /[\uFFFD\uFEFF\u200B-\u200D\u2060]/.test(text);
  const hasExcessiveSpaces = /[ \t]{3,}/.test(text); // 3개 이상의 연속된 공백
  const hasExcessiveNewlines = /\n{3,}/.test(text); // 3개 이상의 연속된 줄바꿈

  return hasControlChars || hasInvalidUnicode || hasExcessiveSpaces || hasExcessiveNewlines;
}
