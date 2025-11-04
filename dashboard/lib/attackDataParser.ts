export interface Technique {
  techniqueID: string;
  name: string;
  description: string;
  tactic: string;
  platforms: string[];
  score?: number;
  status?: 'detected' | 'monitored' | 'not-detected';
  color?: string;
  subTechniques?: Technique[]; // 서브테크닉 추가
  parentTechnique?: string; // 부모 테크닉 ID
}

export interface Tactic {
  id: string;
  name: string;
  description: string;
  techniques: Technique[];
}

export function parseEnterpriseAttackData(data: any): Technique[] {
  const techniques: Technique[] = [];
  const subTechniques: Technique[] = [];
  
  if (!data.objects || !Array.isArray(data.objects)) {
    console.error('Invalid STIX data format');
    return techniques;
  }
  
  for (const obj of data.objects) {
    if (obj.type === 'attack-pattern') {
      const attackId = obj.external_references?.find(
        (ref: any) => ref.source_name === 'mitre-attack'
      )?.external_id;
      
      const tactic = obj.kill_chain_phases?.find(
        (phase: any) => phase.kill_chain_name === 'mitre-attack'
      )?.phase_name;
      
      if (attackId && tactic) {
        const technique: Technique = {
          techniqueID: attackId,
          name: obj.name,
          description: obj.description || '',
          tactic: tactic,
          platforms: obj.x_mitre_platforms || [],
          score: Math.floor(Math.random() * 100), // 테스트용 랜덤 점수
          status: getRandomStatus() // 테스트용 랜덤 상태
        };
        
        // 서브테크닉인지 확인 (예: T1001.001)
        if (attackId.includes('.')) {
          technique.parentTechnique = attackId.split('.')[0];
          subTechniques.push(technique);
        } else {
          techniques.push(technique);
        }
      }
    }
  }
  
  // 서브테크닉을 부모 테크닉에 연결
  for (const subTech of subTechniques) {
    const parentTech = techniques.find(tech => tech.techniqueID === subTech.parentTechnique);
    if (parentTech) {
      if (!parentTech.subTechniques) {
        parentTech.subTechniques = [];
      }
      parentTech.subTechniques.push(subTech);
    }
  }
  
  // 부모 테크닉의 서브테크닉을 이름 순으로 정렬
  for (const tech of techniques) {
    if (tech.subTechniques) {
      tech.subTechniques.sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  
  return techniques;
}

function getRandomStatus(): 'detected' | 'monitored' | 'not-detected' {
  const statuses: ('detected' | 'monitored' | 'not-detected')[] = ['detected', 'monitored', 'not-detected'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export function getTacticDisplayName(tactic: string): string {
  return tactic.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function getTechniqueColor(technique: Technique): string {
  if (technique.color) return technique.color;
  
  // 기본적으로 모든 기술을 흰색/회색으로 표시
  return 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white';
  
  // 기존 코드 (주석 처리)
  /*
  switch (technique.status) {
    case 'detected':
      return 'bg-red-500';
    case 'monitored':
      return 'bg-yellow-500';
    case 'not-detected':
      return 'bg-gray-300';
    default:
      return technique.score ? `bg-blue-${Math.min(Math.floor(technique.score / 20) * 100, 500)}` : 'bg-gray-200';
  }
  */
}

export const TACTIC_ORDER = [
  'reconnaissance',
  'resource-development',
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'command-and-control',
  'exfiltration',
  'impact'
]; 