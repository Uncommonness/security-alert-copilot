# Assistant Init Scripts

OpenSearch ML 플러그인을 사용한 Security Assistant 자동화 설정 스크립트입니다.

## 개요

이 스크립트는 OpenSearch ML 플러그인을 통해 다음과 같은 작업을 자동화합니다:

- 클러스터 설정 적용
- MCP 커넥터 생성
- Gemini 모델 커넥터 생성
- PowerShell 도구 커넥터 생성
- 모델 그룹 등록
- 모델 등록 및 활성화
- 모델 배포
- 에이전트 등록
- 설정 인덱스 등록

## 파일 구성

- `run.py`: 메인 자동화 스크립트
- `requirements.txt`: Python 의존성 패키지 목록
- `.env`: 환경 변수 설정 파일 (별도 생성 필요)

## 사용 방법

### 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```env
# .env 예시 (환경 변수 템플릿)

OPENSEARCH_URL=https://localhost:9200

# OpenSearch Basic Auth 계정 정보
USERNAME_OPENSEARCH=admin
PASSWORD_OPENSEARCH=Developer@123

# 인증서 경로
CERT_PATH=../config/kirk.pem
KEY_PATH=../config/kirk-key.pem

# OpenSearch API 토큰 (예시)
GEMINI_API_TOKEN=GEMINI_API_TOKEN_PLACEHOLDER

GEMINI_MODEL_NAME=gemini-2.5-flash

# Prompt 관련 (Assistant 설정용)
PROMPT_PERSONA=Security Assistant 역할 정의 및 전문 지식 설정
PROMPT_MIDDLE=답변 방식 및 Tool 활용 지침
PROMPT_SUFFIX=사용자 제안 및 실행 규칙 정의
PROMPT_LINK_RULES=링크 제공 형식 규칙
PROMPT_LINK_LIST=실제 사용 가능한 링크 목록

# 커넥터 관련
MCP_CONNECTOR_NAME=MITRE ATTACK MCP (SSE via proxy)
MCP_CONNECTOR_DESC=Connects to the external MCP server for MITRE ATTACK MCP tools
MCP_CONNECTOR_PROTOCOL=mcp_sse
MCP_CONNECTOR_URL=http://host.docker.internal:8089
MCP_CONNECTOR_SSE_ENDPOINT=/sse
```

### 2. 스크립트 실행

#### 수동 실행
```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

## 실행 결과

스크립트 실행 후 각 단계별 성공/실패 상태가 출력됩니다:

- 클러스터 세팅
- 모델 그룹 등록
- MCP 커넥터 생성
- 커넥터 생성
- 툴 커넥터 생성
- 모델 등록
- 모델 활성화
- 모델 배포
- 에이전트 등록
- config 등록

## 주의사항

1. OpenSearch 서버가 실행 중이어야 합니다.
2. SSL 인증서 파일 경로가 올바르게 설정되어야 합니다.
3. Gemini API 토큰이 유효해야 합니다.
4. 네트워크 연결이 안정적이어야 합니다.

## 문제 해결

- **연결 오류**: OpenSearch URL과 인증 정보를 확인하세요.
- **인증서 오류**: CERT_PATH와 KEY_PATH가 올바른지 확인하세요.
- **API 오류**: Gemini API 토큰이 유효한지 확인하세요.
- **타임아웃 오류**: 네트워크 연결 상태를 확인하세요.

## 의존성

- Python 3.7+
- requests
- python-dotenv
- certifi
- charset-normalizer
- idna
- urllib3
