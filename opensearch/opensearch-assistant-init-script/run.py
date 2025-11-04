import requests
import json
import os
import base64
from datetime import datetime
import time
from http import HTTPStatus

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# 단계별 성공/실패 상태 저장용
step_status = {
    'cluster': None,
    'model_group': None,
    'mcp_connector': None,
    'connector': None,
    'model': None,
    'model_enable': None,
    'model_deploy': None,
    'agent': None,
    'config': None
}

# ===== 클러스터 세팅 적용 =====

# 환경 변수에서 민감 정보 및 경로 불러오기

OPENSEARCH_URL             = os.environ.get('OPENSEARCH_URL')
CERT_PATH                  = os.environ.get('CERT_PATH')
KEY_PATH                   = os.environ.get('KEY_PATH')
API_TOKEN                  = os.environ.get('GEMINI_API_TOKEN')
USERNAME                   = os.environ.get('USERNAME_OPENSEARCH')
PASSWORD                   = os.environ.get('PASSWORD_OPENSEARCH')
MODEL_NAME                 = os.environ.get('GEMINI_MODEL_NAME')
MCP_CONNECTOR_NAME         = os.environ.get('MCP_CONNECTOR_NAME')
MCP_CONNECTOR_DESC         = os.environ.get('MCP_CONNECTOR_DESC')
MCP_CONNECTOR_PROTOCOL     = os.environ.get('MCP_CONNECTOR_PROTOCOL')
MCP_CONNECTOR_URL          = os.environ.get('MCP_CONNECTOR_URL')
MCP_CONNECTOR_SSE_ENDPOINT = os.environ.get('MCP_CONNECTOR_SSE_ENDPOINT')
PROMPT_PREFIX              = os.environ.get('PROMPT_PREFIX')
PROMPT_SUFFIX              = os.environ.get('PROMPT_SUFFIX')
PROMPT_MIDDLE              = os.environ.get('PROMPT_MIDDLE')
PROMPT_PERSONA             = os.environ.get('PROMPT_PERSONA')
PROMPT_LINK_CONTEXT        = os.environ.get('PROMPT_LINK_CONTEXT')
PROMPT_LINK_RULES          = os.environ.get('PROMPT_LINK_RULES')
PROMPT_LINK_LIST           = os.environ.get('PROMPT_LINK_LIST')

def U(path: str) -> str:
    """OpenSearch URL 생성 헬퍼 함수"""
    return f"{OPENSEARCH_URL}{path}"

def ml_url(endpoint: str) -> str:
    """ML 플러그인 URL 생성 헬퍼 함수"""
    return U(f"/_plugins/_ml/{endpoint}")

CLUSTER_URL              = U("/_cluster/settings")
CONNECTOR_URL            = ml_url("connectors/_create")
MODEL_GROUP_REGISTER_URL = ml_url("model_groups/_register")
MODEL_REGISTER_URL       = ml_url("models/_register")
AGENT_REGISTER_URL       = ml_url("agents/_register")
OS_CHAT_URL              = U("/.plugins-ml-config/_doc/os_chat")

# Basic Auth 헤더 동적 생성
if USERNAME and PASSWORD:
    userpass = f"{USERNAME}:{PASSWORD}"
    AUTHORIZATION = "Basic " + base64.b64encode(userpass.encode()).decode()
else:
    AUTHORIZATION = None

# ML task 상태 polling 함수
def wait_for_task_complete(task_id, headers, cert_path, key_path, timeout=180, interval=5):
    status_url = ml_url(f"tasks/{task_id}")
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = requests.get(status_url, headers=headers, verify=False, cert=(cert_path, key_path))
            if resp.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]:
                state = resp.json().get('state')
                print(f'[Task 상태 확인] 현재 상태: {state}')
                if state == 'COMPLETED':
                    return True
                elif state in ['FAILED', 'COMPLETED_WITH_ERROR']:
                    return False
        except Exception as e:
            print(f'[Task 상태 확인] 예외 발생: {e}')
        time.sleep(interval)
    print('[Task 상태 확인] timeout')
    return False

headers = {
    "Content-Type": "application/json",
    "Authorization": AUTHORIZATION
}
cluster_data = {
    "persistent": {
        "plugins.ml_commons.only_run_on_ml_node": "false",
        "plugins.ml_commons.mcp_server_enabled": "true",
        "plugins.ml_commons.mcp_connector_enabled": "true",
        "plugins.ml_commons.connector_access_control_enabled": "true",
        "plugins.ml_commons.connector.private_ip_enabled": "true",
        "plugins.ml_commons.memory_feature_enabled": "true",
        "plugins.ml_commons.agent_framework_enabled": "true",
        "plugins.ml_commons.rag_pipeline_feature_enabled": "true",
        "plugins.ml_commons.agentic_search_enabled": "true",
        "plugins.ml_commons.remote_inference.enabled": "true",
        "archived.plugins.index_state_management.metadata_migration.status": None,
        "archived.plugins.index_state_management.template_migration.control": None,
        "plugins.ml_commons.trusted_connector_endpoints_regex": [
            "^https://runtime\\.sagemaker\\..*[a-z0-9-]\\.amazonaws\\.com/.*$",
            "^https://api\\.openai\\.com/.*$",
            "^https://api\\.cohere\\.ai/.*$",
            "^https://bedrock-runtime\\..*[a-z0-9-]\\.amazonaws\\.com/.*$",
            "^https://generativelanguage\\.googleapis\\.com/.*$",
            "^http://host\\.docker\\.internal:8089(/.*)?$"
        ]
    }
}

cluster_response = requests.put(CLUSTER_URL, headers=headers, data=json.dumps(cluster_data), verify=False)
print('[클러스터 세팅] Status:', cluster_response.status_code)
print('[클러스터 세팅] Response:', cluster_response.text)
if cluster_response.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]:
    print("[완료] 클러스터 설정 적용 완료")
    step_status['cluster'] = True
else:
    print(f"[오류] 클러스터 설정 적용 실패: {cluster_response.status_code}")
    step_status['cluster'] = False

print('==== OpenSearch ML 자동화 시작 ===')

# 2. MCP connector 생성

mcp_connector_data = {
    "name": MCP_CONNECTOR_NAME,
    "description": MCP_CONNECTOR_DESC,
    "version": 1,
    "protocol": MCP_CONNECTOR_PROTOCOL,
    "url": MCP_CONNECTOR_URL,
    "credential": {"placeholder": "none"},
    "parameters": {"sse_endpoint": MCP_CONNECTOR_SSE_ENDPOINT},
    "headers": {"Authorization": 'Bearer ${credential.placeholder}'}
}
mcp_connector_response = requests.post(CONNECTOR_URL, headers=headers, data=json.dumps(mcp_connector_data), verify=False)
print(mcp_connector_response.status_code)
print(mcp_connector_response.text)
mcp_connector_success = mcp_connector_response.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]
if mcp_connector_success:
    print("[완료] MCP 커넥터 생성 완료")
    step_status['mcp_connector'] = True
else:
    print(f"[오류] MCP 커넥터 생성 실패: {mcp_connector_response.status_code}")
    step_status['mcp_connector'] = False

# 커넥터 id 추출
mcp_connector_id = None
try:
    mcp_connector_json = mcp_connector_response.json()
    mcp_connector_id = mcp_connector_json.get('connector_id')
    print(f"Extracted connector_id: {mcp_connector_id}")
except Exception as e:
    print(f"Failed to extract connector_id: {e}")


now = datetime.now()
date_str = now.strftime('%y%m%d_%H%M%S')

payload = {
    "name": f"remote_model_group_{date_str}",
    "description": "A model group for external models"
}
try:
    response = requests.post(MODEL_GROUP_REGISTER_URL, headers=headers, data=json.dumps(payload), verify=False)
    print('[모델 그룹 등록 요청] Status:', response.status_code)
    print('[모델 그룹 등록 요청] Response:', response.text)
    if response.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]:
        model_group_id = response.json().get('model_group_id')
        print('[모델 그룹 등록] 성공, model_group_id:', model_group_id)
        step_status['model_group'] = True
    else:
        print('[모델 그룹 등록] 실패')
        model_group_id = None
        step_status['model_group'] = False
except Exception as e:
    print(f'[모델 그룹 등록] 예외 발생:', e)
    model_group_id = None

connector_payload = {
    "name": "Gemini Chat connector 2.5 flash",
    "description": "The connector to public Gemini model service for gemini 2.5 flash",
    "version": 1,
    "protocol": "http",
    "parameters": {
    "model": MODEL_NAME,
        "systemInstruction": {
            "parts": [
                {"text": "${parameters.prompt}"}
            ]
        },
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": "${parameters.question}"}
                ]
            }
        ],
        "temperature": 0.7
    },
    "credential": {
        "api_token": API_TOKEN
    },
    "client_config": {
        "max_retry_times": -1,
        "retry_backoff_millis": 300,
        "retry_backoff_policy": "exponential_full_jitter"
    },
    "actions": [
        {
            "action_type": "predict",
            "method": "POST",
            "url": "https://generativelanguage.googleapis.com/v1beta/models/${parameters.model}:generateContent",
            "headers": {
                "x-goog-api-key": "${credential.api_token}",
                "Content-Type": "application/json"
            },
            "request_body": "{\"generation_config\":{\"temperature\":${parameters.temperature}},\"contents\":${parameters.contents},\"systemInstruction\":${parameters.systemInstruction}}"
        }
    ]
}
try:
    connector_response = requests.post(CONNECTOR_URL, headers=headers, data=json.dumps(connector_payload), verify=False)
    print('[커넥터 생성 요청] Status:', connector_response.status_code)
    print('[커넥터 생성 요청] Response:', connector_response.text)
    if connector_response.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]:
        connector_id = connector_response.json().get('connector_id')
        print('[커넥터 생성] 성공, connector_id:', connector_id)
        step_status['connector'] = True
    else:
        print('[커넥터 생성] 실패')
        connector_id = None
        step_status['connector'] = False
except Exception as e:
    print(f'[커넥터 생성] 예외 발생:', e)
    connector_id = None

# 3. 모델 등록 요청

if model_group_id and connector_id:
    # 모델 등록
    model_payload = {
    "name": MODEL_NAME,
        "function_name": "remote",
        "model_group_id": model_group_id,
        "description": "test model",
        "connector_id": connector_id
    }
    try:
        model_response = requests.post(MODEL_REGISTER_URL, headers=headers, data=json.dumps(model_payload), verify=False)
        print('[모델 등록 요청] Status:', model_response.status_code)
        print('[모델 등록 요청] Response:', model_response.text)
        if model_response.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]:
            model_id = model_response.json().get('model_id')
            print('[모델 등록] 성공, model_id:', model_id)
            step_status['model'] = True
        else:
            print('[모델 등록] 실패')
            model_id = None
            step_status['model'] = False
    except Exception as e:
        print(f'[모델 등록] 예외 발생:', e)
        model_id = None

    # 모델 활성화

    if model_id:
        enable_url = ml_url(f"models/{model_id}")
        enable_payload = {
            "connector_id": connector_id,
            "is_enabled": True
        }
        try:
            enable_response = requests.put(
                enable_url, headers=headers, data=json.dumps(enable_payload),
                verify=False, cert=(CERT_PATH, KEY_PATH)
            )
            print('[모델 활성화 요청] Status:', enable_response.status_code)
            print('[모델 활성화 요청] Response:', enable_response.text)
            if enable_response.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]:
                print('[모델 활성화] 성공')
                step_status['model_enable'] = True
            else:
                print('[모델 활성화] 실패')
                step_status['model_enable'] = False
        except Exception as e:
            print(f'[모델 활성화] 예외 발생:', e)

        # 모델 배포
        deploy_url = ml_url(f"models/{model_id}/_deploy")
        deploy_payload = {
            "name": MODEL_NAME,
            "function_name": model_payload["function_name"],
            "model_group_id": model_group_id,
            "description": model_payload["description"],
            "connector_id": connector_id
        }
        try:
            deploy_response = requests.post(
                deploy_url, headers=headers, data=json.dumps(deploy_payload),
                verify=False, cert=(CERT_PATH, KEY_PATH)
            )
            print('[모델 배포 요청] Status:', deploy_response.status_code)
            print('[모델 배포 요청] Response:', deploy_response.text)
            if deploy_response.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]:
                # task_id가 있으면 polling, 없으면 기존대로
                try:
                    deploy_json = deploy_response.json()
                except Exception:
                    deploy_json = {}
                task_id = deploy_json.get('task_id')
                if task_id:
                    print(f'[모델 배포] task_id: {task_id} - 상태 확인 시작')
                    is_completed = wait_for_task_complete(task_id, headers, CERT_PATH, KEY_PATH)
                    if is_completed:
                        print('[모델 배포] 성공 (task 완료)')
                        step_status['model_deploy'] = True
                    else:
                        print('[모델 배포] 실패 (task 미완료)')
                        step_status['model_deploy'] = False
                else:
                    print('[모델 배포] task_id 없음, 응답만 확인')
                    step_status['model_deploy'] = True
            else:
                print('[모델 배포] 실패')
                step_status['model_deploy'] = False
        except Exception as e:
            print(f'[모델 배포] 예외 발생:', e)

        # 에이전트 등록
        agent_payload = {
            "name": "Gemini conversational agent",
            "type": "conversational",
            "description": "This agent supports running any search query",
            "memory": {
                "type": "conversation_index"
            },
            "llm": {
                "model_id": model_id,
                "parameters": {
                    "prompt.prefix": f"현재 시간: {now.strftime('%Y년 %m월 %d일 %H시 %M분 %S초')}\n\n" + (PROMPT_PERSONA or "") + (PROMPT_MIDDLE or "") + (PROMPT_SUFFIX or "") + (PROMPT_LINK_RULES or "") + (PROMPT_LINK_LIST or ""),
                    "message_history_limit": 20,
                    "stop_when_no_tool_found": True,
                    "response_filter": "$.candidates[0].content.parts[0].text",
                    "disable_trace": False,
                    "max_iteration": 20
                }
            },
            "app_type": "chatbot",
            'parameters': {
                "mcp_connectors": [
                    {
                        "mcp_connector_id": mcp_connector_id if mcp_connector_id else None
                    }
                ]
            },
            "tools": [
                {
                    "type": "ListIndexTool",
                    "name": "ListIndexTool",
                    "description": "모든 인덱스 목록을 조회하는 툴입니다. 특히, 개수, 건수에 대한 질문에 유용합니다.",
                    "include_output_in_agent_response": True,
                    "parameters": {
                        "input": "${parameters.question}"
                    }
                },
                # {
                #     "type": "IndexMappingTool",
                #     "name": "Alert_IndexMappingTool",
                #     "description": "alert 인덱스의 매핑 정보를 조회하는 툴입니다.",
                #     "include_output_in_agent_response": True,
                #     "parameters": {
                #         "index": ["alerts-sim-*"],
                #         "input": "${parameters.question}"
                #     }
                # },
                # {
                #     "type": "IndexMappingTool",
                #     "name": "Event_IndexMappingTool",
                #     "description": "알람 전후 ±10~15분 범위의 세부 행위들(프로세스/네트워크/파일/로그온 등)을 작게 샘플링한 컨텍스트 로그 인덱스의 매핑 정보를 조회하는 툴입니다.",
                #     "include_output_in_agent_response": True,
                #     "parameters": {
                #         "index": ["events-sim-*"],
                #         "input": "${parameters.question}"
                #     }
                # },
                # {
                #     "type": "IndexMappingTool",
                #     "name": "Intel_IndexMappingTool",
                #     "description": "도메인/IP/해시 같은 지표(Indicator) 와 confidence/reputation/tags가 들어있는 간단한 TI 캐시 인덱스의 매핑 정보를 조회하는 툴입니다.",
                #     "include_output_in_agent_response": True,
                #     "parameters": {
                #         "index": ["intel-sim*"],
                #         "input": "${parameters.question}"
                #     }
                # },
                # {
                #     "type": "IndexMappingTool",
                #     "name": "KB_IndexMappingTool",
                #     "description": "답변의 근거 인용과 다음 액션 제안을 만들 때 참고하는 운영 문서/런북 인덱스의 매핑 정보를 조회하는 툴입니다.",
                #     "include_output_in_agent_response": True,
                #     "parameters": {
                #         "index": ["kb-sim*"],
                #         "input": "${parameters.question}"
                #     }
                # },
                {
                    "type": "SearchIndexTool",
                    "parameters": {
                        "return_raw_response": True
                    }
                },
                {
                    "type": "QueryPlanningTool",
                    "parameters": {
                        "model_id": model_id,
                        "response_filter": "$.candidates[0].content.parts[0].text",
                        "generation_type": "llmGenerated",
                        "system_prompt": "You are an OpenSearch Query DSL generation assistant, translating natural language questions to OpenSearch DSL queries. 한국이니까 UTC+9 기준으로 해야합니다.",
                        "user_prompt": "Generate an OpenSearch Query DSL for: ${parameters.question}. Return JSON only."
                    }
                }
            ]
        }
        try:
            agent_response = requests.post(AGENT_REGISTER_URL, headers=headers, data=json.dumps(agent_payload), verify=False)
            print('[에이전트 등록 요청] Status:', agent_response.status_code)
            print('[에이전트 등록 요청] Response:', agent_response.text)
            if agent_response.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]:
                agent_id = agent_response.json().get('agent_id')
                print('[에이전트 등록] 성공, agent_id:', agent_id)
                step_status['agent'] = True
            else:
                print('[에이전트 등록] 실패')
                agent_id = None
                step_status['agent'] = False
        except Exception as e:
            print(f'[에이전트 등록] 예외 발생:', e)
            agent_id = None

        # config 인덱스 등록
        if agent_id:
            config_payload = {
                "type": "os_chat_root_agent",
                "configuration": {
                    "agent_id": agent_id
                }
            }
            try:
                config_response = requests.put(
                    OS_CHAT_URL,
                    headers=headers,
                    data=json.dumps(config_payload),
                    verify=False,
                    cert=(CERT_PATH, KEY_PATH)
                )
                print('[config 등록 요청] Status:', config_response.status_code)
                print('[config 등록 요청] Response:', config_response.text)
                if config_response.status_code in [HTTPStatus.OK, HTTPStatus.CREATED]:
                    print('[config 등록] 성공')
                    step_status['config'] = True
                else:
                    print('[config 등록] 실패')
                    step_status['config'] = False
            except Exception as e:
                print(f'[config 등록] 예외 발생:', e)
        else:
            print('[config 등록] 실패: agent_id 없음')
            step_status['config'] = False
    else:
        print('[모델 등록 이후 단계] 실패: model_id 없음')
        step_status['model_enable'] = False
        step_status['model_deploy'] = False
        step_status['agent'] = False
        step_status['config'] = False
else:
    print('[초기 등록] 실패: model_group_id 또는 connector_id 또는 tool_connector_id 없음')
    step_status['model'] = False
    step_status['model_enable'] = False
    step_status['model_deploy'] = False
    step_status['agent'] = False
    step_status['config'] = False

# ===== 전체 요약 출력 =====
print('\n===== 전체 자동화 단계별 성공/실패 요약 =====')
step_names = {
    'cluster': '클러스터 세팅',
    'model_group': '모델 그룹 등록',
    'mcp_connector': 'MCP 커넥터 생성',
    'connector': '커넥터 생성',
    'model': '모델 등록',
    'model_enable': '모델 활성화',
    'model_deploy': '모델 배포',
    'agent': '에이전트 등록',
    'config': 'config 등록'
}
for k, v in step_status.items():
    result = '성공' if v else ('실패' if v is False else '미실행')
    print(f"- {step_names[k]}: {result}")
