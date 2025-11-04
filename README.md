# 🔒 Security Alert Copilot

> 탐지된 보안 경보를 근거 있는 요약과 실행 가능한 조치로 전환하는 AI 기반 보안 어시스턴트

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![OpenSearch](https://img.shields.io/badge/OpenSearch-3.2.0-orange)](https://opensearch.org/)

## 📋 프로젝트 개요

**Security Alert Copilot**은 보안 운영 센터(SOC) 분석가를 위한 AI 기반 지원 시스템입니다. 대량의 보안 경보를 자동으로 분석하고, OpenSearch 인덱스 기반 데이터(RAG)를 활용하여 근거 있는 분석 결과와 실행 가능한 조치를 제안합니다.

### 핵심 가치

- **보안 경보 과부하 해결**: 수백 개의 경보 중 중요한 것을 식별하고 우선순위화
- **분석 시간 단축**: OpenSearch 인덱스 기반 데이터로 빠른 컨텍스트 제공
- **인간 전문가와 AI 협업**: Human-in-the-Loop 방식으로 안전한 자동화 조치 실행
- **TypeScript 타입 안정성**: 완전한 타입 정의로 안정적인 코드베이스

## 🏗️ 프로젝트 구조

```
project/
├── dashboard/                    # Next.js 대시보드 애플리케이션 (메인)
│   ├── app/                     # Next.js App Router
│   ├── types/                   # TypeScript 타입 정의
│   ├── lib/                     # 공통 유틸리티
│   └── README.md                # 대시보드 상세 가이드
│
├── opensearch/                  # OpenSearch 설정 및 초기화
│   ├── opensearch-assistant-init-script/  # Assistant 자동화 스크립트
│   ├── config/                  # OpenSearch 설정 파일
│   └── SETUP.md                  # 설정 가이드
```

### 각 서브프로젝트 역할

#### 📱 Dashboard (`dashboard/`)
Next.js 14 기반 웹 대시보드 애플리케이션
- AI 에이전트 채팅 인터페이스
- 보안 경보 분석 및 조치 제안
- Human-in-the-Loop 액션 승인 시스템
- OpenSearch 인덱스 기반 RAG 검색

#### 🔍 OpenSearch (`opensearch/`)
OpenSearch 클러스터 설정 및 Assistant 초기화
- OpenSearch ML Plugin 설정
- Assistant 에이전트 등록
- 샘플 데이터 로딩 (alerts, events, intel, kb)

## 🚀 빠른 시작

### 필수 요구사항

- **Node.js** 18 이상
- **pnpm** 10 이상
- **Python** 3.8 이상 (OpenSearch 초기화용)
- **OpenSearch** 3.2.0 이상
- **Docker & Docker Compose** (OpenSearch 로컬 실행용, 선택 사항)

### 설치 및 실행 순서

#### 1. 저장소 클론

```bash
git clone <repository-url>
cd project
```

#### 2. Dashboard 설정 및 실행

```bash
cd dashboard
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필요한 값 설정

# 개발 서버 실행
pnpm dev
```

자세한 내용은 [dashboard/README.md](./dashboard/README.md)를 참고하세요.

#### 3. OpenSearch 설정 (선택 사항)

Docker Compose를 사용하여 로컬 OpenSearch 실행:

```bash
cd opensearch
docker-compose up -d
```

#### 4. OpenSearch Assistant 초기화

```bash
cd opensearch/opensearch-assistant-init-script

# Python 의존성 설치
pip install -r requirements.txt

# .env 파일 생성 및 설정
# 환경 변수 설정 후 실행
python run.py
```

자세한 내용은 [opensearch/opensearch-assistant-init-script/README.md](./opensearch/opensearch-assistant-init-script/README.md)를 참고하세요.

## ✨ 주요 기능

### 1. 🔍 Detection-Aware 분석
- 보안 경보 자동 탐지 및 엔티티 추출 (호스트, IP, 도메인, 해시 등)
- 시간 범위 기반 컨텍스트 분석
- 관련 이벤트 자동 수집 및 연결

### 2. 📚 RAG-Grounded 분석
- OpenSearch 인덱스 기반 데이터 검색
  - `alerts-sim-*`: 보안 경보/알람 데이터
  - `events-sim-*`: 이벤트/행위 로그 데이터
  - `intel-sim`: 위협 인텔리전스 데이터
  - `kb-sim`: 런북/플레이북 문서
- 경보, 이벤트, 위협 인텔리전스, 런북 통합 분석
- 근거 기반 답변 생성 (출처 인용)

### 3. 🤝 Human-in-the-Loop (HITL)
- AI가 제안한 조치에 대한 사용자 승인 필수
- 승인 후 실행 및 결과 피드백
- 모든 조치 실행 이력 저장 (감사 추적)

### 4. ⚡ 실행 가능한 조치
- 화이트리스트 기반 안전한 액션 실행
- PowerShell 명령어 시뮬레이션 (개발 환경)
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

### Frontend (Dashboard)
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5
- **UI Library**: [React](https://reactjs.org/) 18
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context API, [Zustand](https://zustand-demo.pmnd.rs/)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)

### Backend & AI
- **Search Engine**: [OpenSearch](https://opensearch.org/) 3.2.0
  - OpenSearch ML Plugin (AI Agent)
  - Vector Search (RAG)
- **AI Model**: Google Gemini (via OpenSearch ML Plugin)

### 개발 도구
- **Package Manager**: [pnpm](https://pnpm.io/) 10
- **Linting**: ESLint + Next.js config
- **Code Formatting**: Prettier
- **Testing**: Playwright (E2E)

## 📚 주요 문서

### 📖 시작하기 가이드
- [Dashboard README](./dashboard/README.md) - 대시보드 상세 가이드
- [OpenSearch 설정](./opensearch/SETUP.md) - OpenSearch 설정 가이드
- [OpenSearch Assistant 초기화](./opensearch/opensearch-assistant-init-script/README.md)

## 💡 주요 구현 내용

### TypeScript 타입 안정성
- **모든 `any` 타입 제거**: 완전한 타입 정의로 타입 안정성 확보
- 구체적인 타입 정의로 IDE 자동완성 및 타입 체크 지원

### Human-in-the-Loop 액션 실행
- 사용자 승인 필수
- 화이트리스트 기반 안전한 명령어 실행
- 모든 실행 결과 감사 로그 저장

### RAG 기반 인덱스 검색
- OpenSearch 인덱스 기반 검색
- 경보, 이벤트, 인텔리전스, 런북 통합 검색
- 근거 인용 포함 답변 생성

## 📊 프로젝트 통계

- **총 TypeScript 파일**: 100+ 파일
- **타입 정의 파일**: 6개 (`types/` 폴더)
- **API 엔드포인트**: 10+ 개
- **컴포넌트**: 30+ 개

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

### Dashboard 실행 오류
- Node.js 버전 확인 (18 이상)
- `pnpm install` 실행 확인
- 환경 변수 설정 확인

자세한 내용은 각 서브프로젝트의 README를 참고하세요.

## 🤝 기여

이 프로젝트는 포트폴리오 목적으로 제작되었습니다. 개선 사항이나 버그 리포트는 이슈로 등록해주세요.

## 📝 라이선스

포트폴리오 프로젝트입니다.

---

**Made with ❤️ using Next.js, TypeScript, React, and OpenSearch**

