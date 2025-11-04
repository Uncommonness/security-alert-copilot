import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSS 클래스명을 병합하는 유틸리티 함수
 * 
 * clsx와 tailwind-merge를 조합하여 조건부 클래스명을 안전하게 병합합니다.
 * Tailwind의 중복 클래스는 자동으로 처리됩니다.
 * 
 * @param inputs - 병합할 클래스명들 (조건부 값 포함 가능)
 * @returns 병합된 클래스명 문자열
 * 
 * @example
 * ```typescript
 * cn('px-2 py-1', isActive && 'bg-blue-500', className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 간단한 클래스명 병합 함수
 * 
 * falsy 값들을 필터링하고 나머지를 공백으로 결합합니다.
 * 
 * @param classes - 병합할 클래스명들
 * @returns 병합된 클래스명 문자열
 * 
 * @example
 * ```typescript
 * classNames('btn', isActive && 'active', disabled && 'disabled')
 * // 'btn active disabled' 또는 'btn'
 * ```
 */
export function classNames(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 날짜를 한국어 형식으로 포맷합니다.
 * 
 * @param date - 포맷할 날짜 (ISO 문자열 또는 Date 객체)
 * @returns 한국어 로케일 형식의 날짜 문자열
 * 
 * @example
 * ```typescript
 * formatDate(new Date()) // '2025. 1. 1. 오후 3:00:00'
 * ```
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('ko-KR')
}

/**
 * 바이트 수를 읽기 쉬운 파일 크기 형식으로 변환합니다.
 * 
 * @param bytes - 변환할 바이트 수
 * @returns 포맷된 파일 크기 문자열 (예: '1.5 MB')
 * 
 * @example
 * ```typescript
 * formatFileSize(1536000) // '1.46 MB'
 * formatFileSize(1024) // '1 KB'
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 함수 호출을 지연시키는 debounce 함수
 * 
 * 지정된 시간 동안 연속된 호출을 하나로 그룹화합니다.
 * 마지막 호출 후 지정된 시간이 지나야 실제 함수가 실행됩니다.
 * 
 * @param func - debounce할 함수
 * @param wait - 대기 시간 (밀리초)
 * @returns debounced 함수
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query) => {
 *   console.log('검색:', query);
 * }, 300);
 * 
 * debouncedSearch('test'); // 300ms 후 실행
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * ISO 문자열 또는 Date를 한국 표준시(KST) 형식으로 포맷합니다.
 * 
 * @param input - 포맷할 날짜 (ISO 문자열 또는 Date 객체)
 * @param options - Intl.DateTimeFormat 옵션 (선택 사항)
 * @returns 한국 표준시로 포맷된 날짜 문자열
 * 
 * @example
 * ```typescript
 * formatKST('2025-01-01T00:00:00Z') // '2025. 01. 01. 오전 9:00:00'
 * formatKST(new Date(), { year: 'numeric', month: 'long' }) // '2025년 1월'
 * ```
 */
export function formatKST(input: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = typeof input === 'string' ? new Date(input) : input;
  const fmt: Intl.DateTimeFormatOptions = options ?? {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  };
  try {
    return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...fmt }).format(date);
  } catch {
    // Fallback: manual offset (KST = UTC+9) when Intl fails unexpectedly
    const d = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}

/**
 * ISO 문자열 또는 Date를 datetime-local 입력 필드 형식으로 변환합니다.
 * 
 * 한국 표준시(KST)로 변환하여 `YYYY-MM-DDTHH:mm` 형식의 문자열을 반환합니다.
 * 
 * @param input - 변환할 날짜 (ISO 문자열 또는 Date 객체)
 * @returns datetime-local 입력 필드 형식 문자열 (KST)
 * 
 * @example
 * ```typescript
 * toDatetimeLocalKST('2025-01-01T00:00:00Z') // '2025-01-01T09:00'
 * ```
 */
export function toDatetimeLocalKST(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = kst.getUTCFullYear();
  const m = pad(kst.getUTCMonth() + 1);
  const d = pad(kst.getUTCDate());
  const hh = pad(kst.getUTCHours());
  const mm = pad(kst.getUTCMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

/**
 * datetime-local 입력 필드 값을 UTC ISO 문자열로 변환합니다.
 * 
 * 입력값을 한국 표준시(KST)로 간주하고 UTC로 변환합니다.
 * 
 * @param local - datetime-local 형식의 날짜 문자열 (YYYY-MM-DDTHH:mm)
 * @returns UTC ISO 문자열 (Z 포함)
 * 
 * @example
 * ```typescript
 * fromDatetimeLocalKST('2025-01-01T09:00') // '2025-01-01T00:00:00.000Z'
 * ```
 */
export function fromDatetimeLocalKST(local: string): string {
  // local format: YYYY-MM-DDTHH:mm
  const [datePart, timePart] = local.split('T');
  if (!datePart || !timePart) return new Date(local).toISOString();
  const [y, m, d] = datePart.split('-').map((x) => parseInt(x, 10));
  const [hh, mm] = timePart.split(':').map((x) => parseInt(x, 10));
  // Interpret as KST, then convert to UTC by subtracting 9h
  const kstMs = Date.UTC(y, (m - 1), d, hh, mm, 0);
  const utcDate = new Date(kstMs - 9 * 60 * 60 * 1000);
  return utcDate.toISOString();
}
