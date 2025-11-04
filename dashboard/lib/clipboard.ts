/**
 * 텍스트를 클립보드에 복사하는 유틸리티 함수
 * 
 * 최신 Clipboard API를 우선 사용하며, 실패 시 fallback 방식(document.execCommand)을 사용합니다.
 * 
 * @param text - 클립보드에 복사할 텍스트
 * @returns 복사 성공 여부
 * 
 * @example
 * ```typescript
 * const success = await copyToClipboard('Hello, World!');
 * if (success) {
 *   console.log('복사 완료');
 * }
 * ```
 * 
 * @remarks
 * - 브라우저 환경에서만 동작합니다 (SSR에서는 false 반환)
 * - HTTPS 환경 또는 localhost에서만 Clipboard API가 동작합니다
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text ?? '')
      return true
    }
  } catch (_) {
    // fallback below
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text ?? ''
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return !!ok
  } catch (_) {
    return false
  }
}
