# 🔒 Security Alert Copilot

> 탐지된 보안 경보를 근거 있는 요약과 실행 가능한 조치로 전환하는 AI 기반 보안 어시스턴트

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![OpenSearch](https://img.shields.io/badge/OpenSearch-3.2.0-orange)](https://opensearch.org/)

## 📋 프로젝트 개요

**Security Alert Copilot**은 보안 운영 센터(SOC) 분석가를 위한 AI 기반 지원 시스템입니다. 대량의 보안 경보를 자동으로 분석하고, OpenSearch 인덱스 기반 데이터(RAG)를 활용하여 근거 있는 분석 결과와 실행 가능한 조치를 제안합니다.

### 왜 만들었나요?

- **보안 경보 과부하 해결**: 수백 개의 경보 중 중요한 것을 식별하고 우선순위화
- **분석 시간 단축**: OpenSearch 인덱스 기반 데이터로 빠른 컨텍스트 제공
- **인간 전문가와 AI 협업**: Human-in-the-Loop 방식으로 안전한 자동화 조치 실행
- **TypeScript 타입 안정성**: 완전한 타입 정의로 안정적인 코드베이스

## ✨ 주요 기능

### 1. 🔍 Detection-Aware 분석
- 보안 경보 자동 탐지 및 엔티티 추출 (호스트, IP, 도메인, 해시 등)
- 시간 범위 기반 컨텍스트 분석
- 관련 이벤트 자동 수집 및 연결

### 2. 📚 RAG-Grounded 분석
- OpenSearch 인덱스 기반 데이터 검색 (`alerts-*`, `events-*`, `intel-*`, `kb-*`)
- 경보, 이벤트, 위협 인텔리전스, 런북 통합 분석
- 근거 기반 답변 생성 (출처 인용)

### 3. 🤝 Human-in-the-Loop (HITL)
- AI가 제안한 조치에 대한 사용자 승인 필수
- 승인 후 실행 및 결과 피드백
- 모든 조치 실행 이력 저장 (감사 추적)

### 4. ⚡ 실행 가능한 조치
- 화이트리스트 기반 안전한 액션 실행
- 명령어 시뮬레이션 (개발 환경)
- Security API 연동 준비 (프로덕션 환경)

### 5. 🌐 다국어 지원
- 한국어/영어 인터페이스
- 동적 언어 전환
- 다국어 메시지 관리

### 6. 💬 실시간 대화형 인터페이스
- 멘션 기반 인덱스 검색 (`@문서`, `@링크제공`)
- 대화 내역 저장 및 복원
- 마크다운 형식 응답 지원

## 🛠️ 기술 스택

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5
- **UI Library**: [React](https://reactjs.org/) 18
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: 
  - React Context API
  - [Zustand](https://zustand-demo.pmnd.rs/)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Icons**: [@fluentui/react-icons](https://github.com/microsoft/fluentui-system-icons), [@heroicons/react](https://heroicons.com/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)
- **Diagram**: [Mermaid](https://mermaid.js.org/)

### Backend & AI
- **Search Engine**: [OpenSearch](https://opensearch.org/) 3.2.0
  - OpenSearch ML Plugin (AI Agent)
  - Vector Search (RAG)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Date Handling**: [date-fns](https://date-fns.org/)

### 개발 도구
- **Package Manager**: [pnpm](https://pnpm.io/) 10
- **Linting**: ESLint + Next.js config
- **Testing**: Playwright (E2E)

## 🏗️ 프로젝트 구조

```
dashboard/
├── app/                          # Next.js App Router
│   ├── [locale]/                # 다국어 라우팅 (ko, en)
│   │   ├── dashboard/           # 대시보드 홈
│   │   ├── architecture/        # 시스템 아키텍처 설명
│   │   ├── chatbot/            # AI 에이전트 인터페이스
│   │   └── actions-test/        # 액션 실행 테스트
│   ├── api/                     # API 라우트
│   │   ├── actions/            # 보안 조치 실행 API
│   │   │   ├── execute/        # 액션 실행
│   │   │   └── propose/        # 액션 제안
│   │   ├── chatbot-proxy/      # OpenSearch Assistant 프록시
│   │   ├── opensearch/         # OpenSearch 인덱스 조회 (alerts-*, events-*, intel-*, kb-*)
│   │   └── opensearch-dashboards/  # Dashboards API 연동
│   ├── components/             # React 컴포넌트
│   │   ├── actions/           # 액션 승인 UI
│   │   ├── chatbot/          # 챗봇 관련 컴포넌트
│   │   ├── common/           # 공통 컴포넌트
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   └── ui/             # UI 컴포넌트
│   ├── hooks/               # 커스텀 React 훅
│   ├── services/            # API 서비스 레이어
│   └── providers/          # Context Provider
├── types/                   # TypeScript 타입 정의
│   ├── actions.ts          # 액션 관련 타입
│   ├── chatbot.ts         # 챗봇 관련 타입
│   └── api.ts            # API 응답 타입
├── lib/                    # 유틸리티 함수
│   ├── actionParser.ts    # 액션 제안 파싱
│   ├── textSanitizer.ts   # 텍스트 정제
│   └── api.ts            # API 클라이언트
└── messages/              # 다국어 메시지
    ├── ko.json           # 한국어
    └── en.json           # 영어
```

## 🚀 시작하기

### 필수 요구사항

- **Node.js** 18 이상
- **pnpm** 10 이상 ([설치 가이드](https://pnpm.io/installation))
- **OpenSearch** 3.2.0 이상 ([설치 가이드](https://opensearch.org/docs/latest/install-and-configure/))

### 설치 및 실행

#### 1. 저장소 클론

```bash
git clone <repository-url>
cd project/dashboard
```

#### 2. 의존성 설치

```bash
pnpm install
```

#### 3. 환경 변수 설정

`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 필요한 변수를 설정하세요:

```bash
# .env.example을 .env로 복사
cp .env.example .env
```

최소한 다음 필수 변수는 설정해야 합니다:

```env
# OpenSearch 연결 설정 (필수)
OPENSEARCH_DASHBOARDS_URL=https://localhost:5601
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=your_password_here

# TLS 검증 설정 (개발 환경에서는 false 권장)
ENABLE_TLS_VERIFY=false

# 액션 실행 설정 (개발 환경에서는 false로 설정)
ENABLE_ACTION_EXECUTION=false
```

모든 환경 변수 목록과 상세 설명은 [`ENV_VARIABLES.md`](./ENV_VARIABLES.md) 문서를 참고하세요.

> 💡 **주의**: `.env` 파일은 Git에 커밋하지 마세요!

#### 4. OpenSearch 데이터 로딩

OpenSearch에 샘플 데이터(alerts, events, intel, kb)를 로딩합니다:

```bash
cd ../opensearch/opensearch-assistant-init-script
python run.py
```

이 스크립트는 다음 인덱스에 데이터를 로딩합니다:
- `alerts-*`: 보안 경보/알람 데이터
- `events-*`: 이벤트/행위 로그 데이터
- `intel-*`: 위협 인텔리전스 데이터
- `kb-*`: 런북/플레이북 문서

자세한 내용은 [opensearch/opensearch-assistant-init-script/README.md](../opensearch/opensearch-assistant-init-script/README.md)를 참고하세요.

> 💡 **참고**: `run.py` 스크립트는 OpenSearch 데이터 로딩과 Assistant 초기화를 모두 수행합니다.

#### 5. 개발 서버 실행

```bash
cd ../../dashboard
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 사용 가능한 스크립트

```bash
pnpm dev           # 개발 서버 실행 (포트 3000)
pnpm build         # 프로덕션 빌드
pnpm start         # 프로덕션 서버 실행
pnpm lint          # ESLint를 통한 코드 검사
pnpm lint --fix    # 자동 수정 가능한 ESLint 문제 수정
pnpm format        # Prettier를 통한 코드 포매팅
pnpm format:check  # 포매팅 체크 (커밋 전 확인용)
```

> 💡 **코드 품질 도구**:
> - **ESLint 규칙**: [`ESLINT_RULES.md`](./ESLINT_RULES.md) - 코드 품질 검사 규칙
> - **Prettier 설정**: [`PRETTIER_GUIDE.md`](./PRETTIER_GUIDE.md) - 코드 포매팅 설정 및 사용법

## 📸 주요 화면

### 홈 대시보드
- 시스템 개요 및 주요 기능 소개
- 아키텍처 다이어그램
- 실시간 분석 진행률 표시

### AI 에이전트 채팅
- 멘션 기반 검색 (`@문서`로 OpenSearch 인덱스 검색)
- 마크다운 형식 응답
- 액션 승인 및 실행 결과 표시
- OpenSearch 인덱스 기반 데이터 활용

## 💡 주요 구현 내용

### TypeScript 타입 안정성
- **모든 `any` 타입 제거**: 91개 → 0개
- 구체적인 타입 정의로 타입 안정성 확보
- IDE 자동완성 및 타입 체크 지원

```typescript
// types/actions.ts
export type ActionResult = {
  success: boolean;
  action: string;
  command?: string;
  output?: string;
  error?: string;
  auditId?: string;
  simulation?: boolean;
  timestamp?: string;
  params?: Record<string, unknown>;
};
```

### Human-in-the-Loop 액션 실행
- 사용자 승인 필수
- 화이트리스트 기반 안전한 명령어 실행
- 모든 실행 결과 감사 로그 저장

```typescript
// 액션 실행 흐름
1. Agent가 JSON 형식으로 액션 제안
2. 프론트엔드에서 승인 UI 표시
3. 사용자 승인 후 API 호출
4. 결과를 대화 내역에 저장
```

### RAG 기반 인덱스 검색
- OpenSearch 인덱스 기반 검색 (`alerts-*`, `events-*`, `intel-*`, `kb-*`)
- 경보, 이벤트, 인텔리전스, 런북 통합 검색
- 근거 인용 포함 답변 생성
- 사용자 질문에서 엔티티 추출 (호스트, IP, 도메인 등) 후 관련 데이터 검색

### 실시간 대화 관리
- OpenSearch Assistant와 실시간 통신
- 대화 내역 자동 저장
- 새로고침 후 대화 복원

## 📚 주요 문서

- [코드 개선 가이드](./CODE_IMPROVEMENTS.md) - 포트폴리오 목적 코드 정리 가이드
- [액션 실행 가이드](../IMPLEMENTATION_GUIDE.md) - 보안 조치 실행 구현 방법
- [Agent 통합 가이드](../AGENT_INTEGRATION_GUIDE.md) - OpenSearch Agent 통합 방법
- [OpenSearch Assistant 초기화](../opensearch/opensearch-assistant-init-script/README.md)

## 🔧 개발 가이드

### 코드 스타일
- **TypeScript**: Strict 모드 활성화
- **ESLint**: Next.js 권장 설정
- **컴포넌트**: 함수형 컴포넌트 + React Hooks
- **상태 관리**: Context API + Zustand

### 타입 정의
- 모든 타입은 `types/` 폴더에 정의
- `any` 타입 사용 지양
- 인터페이스보다 Type Alias 선호 (명확한 구조가 있을 때)

### 컴포넌트 구조
```
components/
├── common/      # 공통 컴포넌트 (재사용 가능)
├── chatbot/     # 챗봇 전용 컴포넌트
├── layout/      # 레이아웃 컴포넌트
└── ui/          # 기본 UI 컴포넌트
```

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary Purple** (`#592EF2`): 주요 액센트
- **Dark Background** (`#141926`): 배경
- **Light Gray** (`#BFCAD9`): 텍스트
- **Accent Green** (`#29F280`): 성공/활성 상태

### 디자인 원칙
- **글래스모피즘**: 반투명 카드와 블러 효과
- **3D 요소**: 그림자, 글로우 애니메이션
- **큰 타이포그래피**: 중요 정보 강조
- **일관성**: 통일된 색상과 스타일

## 🔐 보안 고려사항

### 액션 실행 보안
- ✅ 화이트리스트 방식 (허용된 액션만 실행)
- ✅ 사용자 승인 필수 (Human-in-the-Loop)
- ✅ 위험한 명령어는 시뮬레이션만 지원
- ✅ 안전한 읽기 전용 명령어만 실제 실행 가능
- ⚠️ 프로덕션 환경에서는 Security API 연동 권장

### 환경 변수
- 민감한 정보는 서버 사이드에서만 접근
- `.env` 파일은 Git에 커밋하지 않음
- `.env.example`로 템플릿 제공

## 🐛 트러블슈팅

### OpenSearch 연결 오류
```
Error: unable to verify the first certificate
```
**해결**: `.env` 파일에서 `ENABLE_TLS_VERIFY=false` 설정

### 멘션 팝오버가 나타나지 않음
- `@` 문자 입력 후 약간의 지연이 필요할 수 있습니다
- 네트워크 요청이 완료될 때까지 기다려보세요

### 액션 실행이 되지 않음
- `.env`에서 `ENABLE_ACTION_EXECUTION=true` 설정 확인
- 위험한 명령어는 항상 시뮬레이션 모드로 실행됩니다

## 📖 학습 자료

- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [OpenSearch ML Plugin](https://opensearch.org/docs/latest/ml-commons-plugin/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React 18 문서](https://react.dev/)

## 🤝 기여

이 프로젝트는 포트폴리오 목적으로 제작되었습니다. 개선 사항이나 버그 리포트는 이슈로 등록해주세요.

## 📝 라이선스

포트폴리오 프로젝트입니다.

---

**Made with ❤️ using Next.js, TypeScript, and OpenSearch**
