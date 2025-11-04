# OpenSearch 설정 파일 가이드

## 설정 파일 준비

이 프로젝트는 민감한 정보를 포함할 수 있는 설정 파일을 Git에 포함하지 않습니다. 
대신 템플릿 파일(`.example`)을 제공하므로, 이를 복사하여 사용하세요.

### 1. docker-compose.yaml

```bash
cd opensearch
cp docker-compose.yaml.example docker-compose.yaml
```

`.env` 파일에 다음 환경 변수를 설정하세요:
```env
OPENSEARCH_VERSION=3.2.0
OPENSEARCH_INITIAL_ADMIN_PASSWORD=your_secure_password_here
```

### 2. opensearch.yml

```bash
cd opensearch/config
cp opensearch.yml.example opensearch.yml
```

필요에 따라 인증서 경로 등을 수정하세요.

### 3. opensearch_dashboards.yml

```bash
cd opensearch/config
cp opensearch_dashboards.yml.example opensearch_dashboards.yml
```

필요에 따라 다음 설정을 수정하세요:
- `opensearch.username`: OpenSearch 사용자명
- `opensearch.password`: OpenSearch 비밀번호
- `server.ssl.certificate`: SSL 인증서 경로
- `server.ssl.key`: SSL 키 경로

## 보안 주의사항

⚠️ **중요**: 
- 실제 설정 파일(`docker-compose.yaml`, `opensearch.yml`, `opensearch_dashboards.yml`)은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다.
- 비밀번호, 인증서 경로 등 민감한 정보는 환경 변수나 별도 설정 파일을 사용하세요.
- 템플릿 파일(`.example`)만 Git에 포함되어 형상 관리됩니다.

