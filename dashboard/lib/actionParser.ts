/**
 * Agent 응답에서 액션 제안을 파싱하는 유틸리티
 * 
 * OpenSearch Assistant가 텍스트 응답에 포함시킨 JSON 형식의 액션 제안을 추출합니다.
 */

/**
 * 제안된 액션 인터페이스
 * 
 * Agent가 제안한 액션의 구조를 정의합니다.
 */
export interface ProposedAction {
  /** 액션 ID */
  action: string;
  /** 액션 파라미터 */
  params: Record<string, unknown>;
  /** 액션 설명 */
  description: string;
  /** 실행될 명령어 (선택 사항) */
  command?: string;
}

/**
 * Agent 응답 텍스트에서 액션 제안을 추출합니다.
 * 
 * 여러 형식의 액션 제안을 지원합니다:
 * 1. JSON 코드 블록 (```json ... ```)
 * 2. 인라인 JSON 객체
 * 3. 구조화된 텍스트 패턴 ("액션: ..., 파라미터: ...")
 * 
 * @param content - Agent 응답 텍스트
 * @returns 파싱된 액션 제안 또는 null (파싱 실패 시)
 * 
 * @example
 * ```typescript
 * const content = '```json\n{"action": "list-processes", "params": {}, "description": "프로세스 목록 조회"}\n```';
 * const action = parseActionProposal(content);
 * // { action: 'list-processes', params: {}, description: '프로세스 목록 조회' }
 * ```
 */
export function parseActionProposal(content: string): ProposedAction | null {
  // JSON 코드 블록에서 추출 시도
  const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?"action"[\s\S]*?\})\s*```/;
  const jsonMatch = content.match(jsonBlockRegex);
  
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.action) {
        return parsed;
      }
    } catch (e) {
      // JSON 파싱 실패
    }
  }

  // 인라인 JSON 패턴
  const inlineJsonRegex = /\{\s*"action"\s*:\s*"([^"]+)",\s*"params"\s*:\s*(\{[^}]*\}),\s*"description"\s*:\s*"([^"]+)"\s*\}/;
  const inlineMatch = content.match(inlineJsonRegex);
  
  if (inlineMatch) {
    try {
      return {
        action: inlineMatch[1],
        params: JSON.parse(inlineMatch[2]),
        description: inlineMatch[3]
      };
    } catch (e) {
      // 파싱 실패
    }
  }

  // 구조화된 텍스트 패턴
  // "액션: host-isolate, 파라미터: {hostname: 'WS-023'}"
  const textPattern = /액션\s*[:：]\s*([^\s,]+)[,，]\s*파라미터\s*[:：]\s*(\{[^}]+\})/i;
  const textMatch = content.match(textPattern);
  
  if (textMatch) {
    try {
      return {
        action: textMatch[1].trim(),
        params: JSON.parse(textMatch[2]),
        description: content.split('\n')[0] || '액션 제안'
      };
    } catch (e) {
      // 파싱 실패
    }
  }

  return null;
}

/**
 * 텍스트에서 여러 액션 제안을 파싱합니다.
 * 
 * 단일 텍스트에서 여러 액션이 포함된 경우를 처리합니다.
 * JSON 배열 형식 또는 여러 JSON 블록을 지원합니다.
 * 
 * @param content - 여러 액션 제안이 포함된 텍스트
 * @returns 파싱된 액션 제안 배열 (빈 배열일 수 있음)
 * 
 * @example
 * ```typescript
 * const content = '```json\n[{"action": "list-processes"}, {"action": "system-info"}]\n```';
 * const actions = parseMultipleActions(content);
 * // [{ action: 'list-processes' }, { action: 'system-info' }]
 * ```
 */
export function parseMultipleActions(content: string): ProposedAction[] {
  const actions: ProposedAction[] = [];
  
  // JSON 배열 패턴
  const arrayPattern = /```(?:json)?\s*(\[[\s\S]*?\])\s*```/;
  const arrayMatch = content.match(arrayPattern);
  
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[1]);
      if (Array.isArray(parsed)) {
        return parsed.filter(a => a.action);
      }
    } catch (e) {
      // 배열 파싱 실패
    }
  }

  // 각 JSON 블록을 개별적으로 파싱
  const jsonBlocks = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/g);
  if (jsonBlocks) {
    for (const block of jsonBlocks) {
      const action = parseActionProposal(block);
      if (action) {
        actions.push(action);
      }
    }
  }

  return actions;
}

