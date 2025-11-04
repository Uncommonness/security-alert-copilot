'use client';

import { useTranslations, useLocale } from 'next-intl';
import { ShieldCheckmark24Regular, Document24Regular, Sparkle24Regular, Database24Regular, Cloud24Regular } from '@fluentui/react-icons';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
const Mermaid = dynamic(() => import('../../components/common/Mermaid'), { ssr: false });

export default function ArchitecturePage() {
  const t = useTranslations('architecture');
  const locale = useLocale();

  // 다이어그램 코드를 동적으로 생성
  const systemContextDiagram = useMemo(() => `flowchart LR
   %% Nodes
   A["Security Data Sources"]
   AL["alerts-*"]
   EV["events-*"]
   IN["intel-*"]
   KB["kb-*"]
   UI["Next.js Dashboard<br/>(Chatbot Component)"]
   API["API Routes<br/>(Next.js)"]
   ASST["OpenSearch Dashboards<br/>Assistant API"]
   ACT["Actions API<br/>(/api/actions/execute)"]
   PS["Command Execution<br/>(${t('diagram.systemContext.commandExecution')})"]
 
   %% Styling
   classDef ext fill:#1f2937,stroke:#64748b,color:#e5e7eb
   classDef data fill:#0b1020,stroke:#5a62f2,color:#cbd5e1
   classDef frontend fill:#141926,stroke:#7c3aed,color:#e5e7eb
   classDef backend fill:#1a1f35,stroke:#592EF2,color:#cbd5e1
   classDef act fill:#102015,stroke:#22c55e,color:#cbd5e1
   linkStyle default stroke:#5a62f2,stroke-width:1.5px
 
   %% Groups
   subgraph External["${t('diagram.systemContext.external')}"]
     A
   end
 
   subgraph Data["${t('diagram.systemContext.dataLayer')}"]
     AL
     EV
     IN
     KB
   end
 
   subgraph Frontend["${t('diagram.systemContext.frontend')}"]
     UI
     API
   end
 
   subgraph Backend["${t('diagram.systemContext.backend')}"]
     ASST
   end
 
   subgraph Actions["${t('diagram.systemContext.actions')}"]
     ACT
     PS
   end
 
   %% Class attach
   class A ext
   class AL,EV,IN,KB data
   class UI,API frontend
   class ASST backend
   class ACT,PS act
 
   %% Flows
   A --> AL
   UI --> API
   API --> ASST
   ASST --> AL
   ASST --> EV
   ASST --> IN
   ASST --> KB
   ASST --> API
   API --> UI
   UI --> ACT
   ACT --> PS`, [t]);

  const dataFlowDiagram = useMemo(() => `%%{init: {"theme":"dark","securityLevel":"loose","flowchart":{"htmlLabels":false,"wrap":true}}}%%
flowchart TD
  %% class definitions first
  classDef ui fill:#141926,stroke:#592EF2,color:#BFCAD9
  linkStyle default stroke:#5a62f2,stroke-width:1.5px

  AL["alerts-*\\n${t('diagram.dataFlow.alertLabel')}"] -->|"host, time +/- 15m, pid"| EV["events-*\\n${t('diagram.dataFlow.eventLabel')}"]
  AL -->|"domain/ip/hash"| IN["intel-*\\n${t('diagram.dataFlow.intelLabel')}"]
  AL -->|"rule.id / technique / tags"| KB["kb-*\\n${t('diagram.dataFlow.kbLabel')}"]
 
  EV -->|"domain/ip"| IN
  EV -->|"${t('diagram.dataFlow.techTags')}"| KB
 
  ASST["OpenSearch Assistant<br/>(${t('diagram.dataFlow.assistant')})"] -->|"${t('diagram.dataFlow.entityExtract')}<br/>${t('diagram.dataFlow.queryGen')}"| AL
  ASST -->|"${t('diagram.dataFlow.contextEnrichLabel')}"| EV
  ASST -->|"${t('diagram.dataFlow.evidenceCiteLabel')}"| KB
  
  UI["${t('diagram.dataFlow.question')}\\n${t('diagram.dataFlow.example')}"] -->|"${t('diagram.dataFlow.apiRequest')}"| ASST

  class AL,EV,IN,KB,ASST ui`, [t]);

  const sequenceDiagram = useMemo(() => `sequenceDiagram
  autonumber
  participant U as ${t('diagram.sequence.user')}
  participant UI as ${t('diagram.sequence.chatbot')}<br/>(Next.js)
  participant API as ${t('diagram.sequence.apiRoutes')}<br/>(/api/chatbot-proxy)
  participant ASST as ${t('diagram.sequence.assistantApi')}
  participant OS as ${t('diagram.sequence.opensearch')}<br/>(Indices)
  participant ACT as ${t('diagram.sequence.actionsApi')}<br/>(/api/actions/execute)
  participant PS as ${t('diagram.sequence.commandExecution')}
 
  U->>UI: "${t('diagram.sequence.summaryRequest')}"
  UI->>API: POST /api/chatbot-proxy<br/>(messages, conversationId)
  API->>ASST: POST /api/assistant/send_message<br/>(Basic Auth)
  ASST->>ASST: ${t('diagram.sequence.entityExtract')}(host=WS-023, window=24h)
  ASST->>OS: search alerts-*<br/>(host=WS-023, last 24h)
  OS-->>ASST: ${t('diagram.sequence.alertList')}
  ASST->>OS: search events-*<br/>(${t('diagram.sequence.perAlert')})
  OS-->>ASST: ${t('diagram.sequence.events')}
  ASST->>OS: search intel-*<br/>(${t('diagram.sequence.domainIpMatch')})
  OS-->>ASST: ${t('diagram.sequence.intel')}
  ASST->>OS: search kb-*<br/>(${t('diagram.sequence.ruleTechTags')})
  OS-->>ASST: ${t('diagram.sequence.runbookDoc')}
  ASST-->>API: ${t('diagram.sequence.assistantResponse')}<br/>(messages, conversationId)
  API-->>UI: ${t('diagram.sequence.messageList')}
  UI-->>U: ${t('diagram.sequence.summaryEvidence')}<br/>+ ${t('diagram.sequence.playbookSuggestion')}
  
  Note over UI: ${t('diagram.sequence.pollingStart')}<br/>(${t('diagram.sequence.waitingResponse')})
  UI->>API: GET /api/opensearch-dashboards/<br/>assistant/conversation/{id}
  API->>ASST: GET /api/assistant/conversation/{id}
  ASST-->>API: ${t('diagram.sequence.messageUpdate')}
  API-->>UI: ${t('diagram.sequence.latestMessage')}
  UI-->>U: ${t('diagram.sequence.streamingResponse')}
  
  Note over UI,U: ${t('diagram.sequence.actionApprovalFlow')}
  U->>UI: ${t('diagram.sequence.actionApprovalClick')}<br/>(ActionApprovalButton)
  UI->>ACT: POST /api/actions/execute<br/>(action, params, approved=true)
  alt ${t('diagram.sequence.safeReadOnly')}<br/>(${t('diagram.sequence.actionExecEnabled')})
    ACT->>PS: ${t('diagram.sequence.commandExec')}
    PS-->>ACT: ${t('diagram.sequence.execResult')}
  else ${t('diagram.sequence.dangerousOrSim')}<br/>${t('diagram.sequence.simulationMode')}
    ACT->>ACT: ${t('diagram.sequence.simulationExec')}
    ACT-->>ACT: ${t('diagram.sequence.mockResult')}
  end
  ACT-->>UI: ActionResult<br/>(success, output, auditId, simulation)
  UI->>UI: ${t('diagram.sequence.reflectResult')}<br/>(handleActionApproved)
  UI->>API: POST /api/chatbot-proxy<br/>(${t('diagram.sequence.actionFeedback')})
  API->>ASST: POST /api/assistant/send_message<br/>(${t('diagram.sequence.resultMessage')} + conversationId)
  ASST-->>API: ${t('diagram.sequence.confirmResponse')}
  API-->>UI: ${t('diagram.sequence.complete')}
  UI-->>U: ${t('diagram.sequence.completionNotice')} +<br/>${t('diagram.sequence.savedToHistory')}`, [t]);

  const batchDiagram = useMemo(() => `flowchart LR
  %% classes first
  classDef w fill:#0f172a,stroke:#334155,color:#e2e8f0
  classDef s fill:#111827,stroke:#4f46e5,color:#e5e7eb
  classDef d fill:#0b1020,stroke:#22c55e,color:#cbd5e1
  classDef x fill:#111827,stroke:#64748b,color:#e2e8f0
  linkStyle default stroke:#5a62f2,stroke-width:1.5px
 
  %% nodes
  UI["Next.js Dashboard<br/>(${t('diagram.batch.dashboard')})<br/>- Chatbot Component<br/>- FloatingNav<br/>- MessageList"]
  API["Next.js API Routes<br/>- /api/chatbot-proxy<br/>- /api/opensearch-dashboards/*<br/>- /api/actions/execute<br/>- /api/opensearch/indices"]
  ASST["OpenSearch Dashboards<br/>Assistant API<br/>(${t('diagram.batch.externalService')})"]
  OS_LIST["OpenSearch<br/>(${t('diagram.batch.indexListQuery')})"]
  OS_DATA[("OpenSearch 3.x<br/>(${t('diagram.batch.dataSearch')})<br/>- alerts-*<br/>- events-*<br/>- intel-*<br/>- kb-*")]
  ACT[["Actions System<br/>- ${t('diagram.batch.commandExec')}<br/>- ${t('diagram.batch.simulationMode')}<br/>- ${t('diagram.batch.auditLogging')}"]]
 
  %% class attach
  class UI w
  class API s
  class ASST s
  class OS_LIST,OS_DATA d
  class ACT x
 
  %% edges
  UI --- API
  API --- ASST
  API --- OS_LIST
  API --- ACT
  ASST --- OS_DATA`, [t]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: '#141926' }}>
      <div className="absolute inset-0 dashboard-grid-pattern opacity-30"></div>
      <div className="absolute top-20 left-10 w-64 h-64 dashboard-glow" style={{ 
        background: 'radial-gradient(circle, #592EF2 0%, transparent 70%)',
        transform: 'translate3d(0,0,0)'
      }}></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 dashboard-glow" style={{ 
        background: 'radial-gradient(circle, #29F280 0%, transparent 70%)',
        transform: 'translate3d(0,0,0)',
        animationDelay: '1.5s'
      }}></div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 pt-20 md:pt-32 pb-12 md:pb-16">
        <div className="mb-12 md:mb-20 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 dashboard-text-3d tracking-tight px-4" style={{ color: '#ffffff' }}>
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl font-light dashboard-gradient-text-subtle px-4">
            {t('subtitle')}
          </p>
        </div>

        <div className="mb-8 md:mb-12">
          <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-6 md:p-12">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-4 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(88, 46, 242, 0.15)' }}>
                <Cloud24Regular className="w-6 h-6 md:w-8 md:h-8" style={{ color: '#592EF2' }} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-white">{t('architecture_title')}</h2>
                <p className="text-base md:text-lg text-[#BFCAD9] leading-relaxed">
                  {t('architecture_description')}
                </p>
              </div>
            </div>
            {/* 태그라인 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[#BFCAD9]">
                Detection-Aware · RAG-Grounded · Human-in-the-Loop
              </p>
            </div>
          </div>
        </div>

        {/* 1) 시스템 컨텍스트 다이어그램 */}
        <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6 md:mb-8 overflow-x-auto">
          <Mermaid
            code={systemContextDiagram}
          />
          <p className="mt-3 text-[#BFCAD9] text-sm">{t('diagram.systemContext.description')}</p>
        </div>

        {/* 2) 데이터 플로우/관계 다이어그램 */}
        <div className="dashboard-glass-card rounded-3xl p-6 mb-8">
          <Mermaid
            code={dataFlowDiagram}
          />
          <p className="mt-3 text-[#BFCAD9] text-sm">{t('architecture.diagram.alarmCenter')}</p>
        </div>

        {/* 3) 시퀀스 다이어그램 */}
        <div className="dashboard-glass-card rounded-3xl p-6 mb-8">
          <Mermaid
            code={sequenceDiagram}
          />
          <p className="mt-3 text-[#BFCAD9] text-sm">{t('diagram.sequence.description')}</p>
        </div>

        {/* 4) 배치 다이어그램 */}
        <div className="dashboard-glass-card rounded-3xl p-6 mb-12">
          <Mermaid
            code={batchDiagram}
          />
          <p className="mt-3 text-[#BFCAD9] text-sm">{t('diagram.batch.description')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-300" style={{ border: '2px solid rgba(88, 46, 242, 0.3)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6" style={{ background: 'rgba(88, 46, 242, 0.15)' }}>
                <Document24Regular className="w-6 h-6 md:w-8 md:h-8 text-[#592EF2]" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{t('step1_title')}</h3>
              <p className="text-[#BFCAD9] text-xs md:text-sm leading-relaxed">{t('step1_description')}</p>
            </div>
          </div>

          <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-300" style={{ border: '2px solid rgba(41, 242, 128, 0.3)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6" style={{ background: 'rgba(41, 242, 128, 0.15)' }}>
                <Database24Regular className="w-6 h-6 md:w-8 md:h-8 text-[#29F280]" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{t('step2_title')}</h3>
              <p className="text-[#BFCAD9] text-xs md:text-sm leading-relaxed">{t('step2_description')}</p>
            </div>
          </div>

          <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-300" style={{ border: '2px solid rgba(88, 46, 242, 0.3)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6" style={{ background: 'rgba(88, 46, 242, 0.15)' }}>
                <Sparkle24Regular className="w-6 h-6 md:w-8 md:h-8 text-[#592EF2]" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{t('step3_title')}</h3>
              <p className="text-[#BFCAD9] text-xs md:text-sm leading-relaxed">{t('step3_description')}</p>
            </div>
          </div>

          <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-300" style={{ border: '2px solid rgba(41, 242, 128, 0.3)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6" style={{ background: 'rgba(41, 242, 128, 0.15)' }}>
                <ShieldCheckmark24Regular className="w-6 h-6 md:w-8 md:h-8 text-[#29F280]" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{t('step4_title')}</h3>
              <p className="text-[#BFCAD9] text-xs md:text-sm leading-relaxed">{t('step4_description')}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-6 md:p-12 mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-white">{t('rag_title')}</h2>
          <div className="space-y-3 md:space-y-4">
            <div className="flex gap-3 md:gap-4">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#592EF2' }}></div>
              <p className="text-base md:text-lg text-[#BFCAD9] leading-relaxed">{t('rag_step1')}</p>
            </div>
            <div className="flex gap-3 md:gap-4">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#29F280' }}></div>
              <p className="text-base md:text-lg text-[#BFCAD9] leading-relaxed">{t('rag_step2')}</p>
            </div>
            <div className="flex gap-3 md:gap-4">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#592EF2' }}></div>
              <p className="text-base md:text-lg text-[#BFCAD9] leading-relaxed">{t('rag_step3')}</p>
            </div>
            <div className="flex gap-3 md:gap-4">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#29F280' }}></div>
              <p className="text-base md:text-lg text-[#BFCAD9] leading-relaxed">{t('rag_step4')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-6 md:p-8" style={{ border: '1px solid rgba(88, 46, 242, 0.3)' }}>
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white">{t('tech_stack.frontend')}</h3>
            <ul className="space-y-2 text-sm md:text-base text-[#BFCAD9]">
              <li>• Next.js 14 (App Router)</li>
              <li>• React 18</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• next-intl ({t('techStack.i18n')})</li>
              <li>• React Context/Hooks</li>
            </ul>
          </div>
          <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-6 md:p-8" style={{ border: '1px solid rgba(88, 46, 242, 0.3)' }}>
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white">API & Backend</h3>
            <ul className="space-y-2 text-sm md:text-base text-[#BFCAD9]">
              <li>• Next.js API Routes</li>
              <li>• OpenSearch Dashboards Assistant</li>
              <li>• RAG Pipeline (Assistant)</li>
              <li>• Entity Extraction</li>
              <li>• Context Enrichment</li>
              <li>• Human-in-the-Loop</li>
            </ul>
          </div>
          <div className="dashboard-glass-card rounded-2xl md:rounded-3xl p-6 md:p-8" style={{ border: '1px solid rgba(88, 46, 242, 0.3)' }}>
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white">{t('techStack.dataAndActions')}</h3>
            <ul className="space-y-2 text-sm md:text-base text-[#BFCAD9]">
              <li>• OpenSearch 3.x</li>
              <li>• {t('techStack.index')}: alerts-*</li>
              <li>• {t('techStack.index')}: events-*</li>
              <li>• {t('techStack.index')}: intel-*, kb-*</li>
              <li>• {t('techStack.commandExec')}</li>
              <li>• {t('techStack.actionSimulation')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

