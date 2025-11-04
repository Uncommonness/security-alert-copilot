"""
보안 경보 코파일럿 샘플 데이터 로딩 스크립트

사용법:
    python load_sample_data.py

이 스크립트는 다음 인덱스에 샘플 데이터를 로드합니다:
- alerts-sim-YYYY.MM.DD: 탐지 결과/알람 데이터
- events-sim-YYYY.MM.DD: 컨텍스트 이벤트/행위 로그  
- intel-sim: Threat Intelligence 지표
- kb-sim: RAG 문서/런북/플레이북

데이터 파일 위치:
    data/
    ├── alerts/
    │   └── alerts-sim-2025.01.15.json
    │   └── alerts-sim-2025.01.16.json
    ├── events/
    │   └── events-sim-2025.01.15.json
    │   └── events-sim-2025.01.16.json
    ├── intel/
    │   └── intel-sim.json
    └── kb/
        └── kb-sim.json
"""

import requests
import json
import os
import base64
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# 환경 변수
OPENSEARCH_URL = os.environ.get('OPENSEARCH_URL')
CERT_PATH = os.environ.get('CERT_PATH')
KEY_PATH = os.environ.get('KEY_PATH')
USERNAME = os.environ.get('USERNAME_OPENSEARCH')
PASSWORD = os.environ.get('PASSWORD_OPENSEARCH')

# Basic Auth
if USERNAME and PASSWORD:
    userpass = f"{USERNAME}:{PASSWORD}"
    AUTHORIZATION = "Basic " + base64.b64encode(userpass.encode()).decode()
else:
    AUTHORIZATION = None

headers = {
    "Content-Type": "application/json",
    "Authorization": AUTHORIZATION
}

def load_json_file(file_path):
    """JSON 파일 로드"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_index(index_name, mapping):
    """인덱스 생성"""
    url = f"{OPENSEARCH_URL}/{index_name}"
    
    # 인덱스가 이미 존재하면 삭제
    response = requests.head(url, headers=headers, verify=False, cert=(CERT_PATH, KEY_PATH))
    if response.status_code == 200:
        print(f"[{index_name}] 이미 존재합니다. 삭제 후 재생성합니다.")
        requests.delete(url, headers=headers, verify=False, cert=(CERT_PATH, KEY_PATH))
    
    # 인덱스 생성
    response = requests.put(url, headers=headers, json=mapping, verify=False, cert=(CERT_PATH, KEY_PATH))
    if response.status_code in [200, 201]:
        print(f"[{index_name}] 생성 완료")
        return True
    else:
        print(f"[{index_name}] 생성 실패: {response.status_code} - {response.text}")
        return False

def bulk_index(index_name, documents):
    """Bulk API로 문서 인덱싱"""
    url = f"{OPENSEARCH_URL}/_bulk"
    
    bulk_data = []
    for doc in documents:
        bulk_data.append(json.dumps({"index": {"_index": index_name}}))
        bulk_data.append(json.dumps(doc))
    
    bulk_body = "\n".join(bulk_data) + "\n"
    
    response = requests.post(
        url, 
        headers=headers, 
        data=bulk_body, 
        verify=False, 
        cert=(CERT_PATH, KEY_PATH)
    )
    
    if response.status_code in [200, 201]:
        result = response.json()
        if result.get('errors'):
            print(f"[{index_name}] 일부 문서 인덱싱 실패")
        else:
            print(f"[{index_name}] {len(documents)}개 문서 인덱싱 완료")
        return True
    else:
        print(f"[{index_name}] 인덱싱 실패: {response.status_code} - {response.text}")
        return False

def load_ndjson_bulk(file_path):
    """NDJSON bulk 파일 직접 전송"""
    if not os.path.exists(file_path):
        print(f"[알림] {file_path} 파일이 없습니다.")
        return False
    
    url = f"{OPENSEARCH_URL}/_bulk"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        bulk_body = f.read()
    
    response = requests.post(
        url,
        headers={
            "Content-Type": "application/x-ndjson",
            "Authorization": AUTHORIZATION
        },
        data=bulk_body.encode('utf-8'),
        verify=False,
        cert=(CERT_PATH, KEY_PATH)
    )
    
    if response.status_code in [200, 201]:
        result = response.json()
        if result.get('errors'):
            print(f"[{file_path}] 일부 문서 인덱싱 실패")
        else:
            print(f"[{file_path}] Bulk 인덱싱 완료")
        return True
    else:
        print(f"[{file_path}] 인덱싱 실패: {response.status_code} - {response.text}")
        return False

def load_alerts_data():
    """alerts 데이터 로드 (NDJSON bulk 형식)"""
    data_dir = os.path.join(os.path.dirname(__file__), 'data', 'alerts')
    file_path = os.path.join(data_dir, "alerts-sim-bulk.ndjson")
    
    if os.path.exists(file_path):
        print(f"\n📊 alerts-sim bulk 데이터 로딩...")
        load_ndjson_bulk(file_path)
    else:
        print(f"\n⚠️ {file_path} 파일이 없습니다.")

def load_events_data():
    """events 데이터 로드 (NDJSON bulk 형식)"""
    data_dir = os.path.join(os.path.dirname(__file__), 'data', 'events')
    file_path = os.path.join(data_dir, "events-sim-bulk.ndjson")
    
    if os.path.exists(file_path):
        print(f"\n📊 events-sim bulk 데이터 로딩...")
        load_ndjson_bulk(file_path)
    else:
        print(f"\n⚠️ {file_path} 파일이 없습니다.")

def load_intel_data():
    """intel 데이터 로드 (NDJSON bulk 형식)"""
    data_dir = os.path.join(os.path.dirname(__file__), 'data', 'intel')
    file_path = os.path.join(data_dir, "intel-sim-bulk.ndjson")
    
    if os.path.exists(file_path):
        print(f"\n📊 intel-sim bulk 데이터 로딩...")
        load_ndjson_bulk(file_path)
    else:
        print(f"\n⚠️ {file_path} 파일이 없습니다.")

def load_kb_data():
    """kb 데이터 로드 (NDJSON bulk 형식)"""
    data_dir = os.path.join(os.path.dirname(__file__), 'data', 'kb')
    file_path = os.path.join(data_dir, "kb-sim-bulk.ndjson")
    
    if os.path.exists(file_path):
        print(f"\n📊 kb-sim bulk 데이터 로딩...")
        load_ndjson_bulk(file_path)
    else:
        print(f"\n⚠️ {file_path} 파일이 없습니다.")

def main():
    print("=" * 60)
    print("보안 경보 코파일럿 샘플 데이터 로딩 시작")
    print("=" * 60)
    
    # data 디렉토리 생성
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data', 'alerts'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data', 'events'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data', 'intel'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data', 'kb'), exist_ok=True)
    
    # 파일이 존재하는지 확인 (NDJSON bulk 형식)
    alerts_exist = os.path.exists(os.path.join(os.path.dirname(__file__), 'data', 'alerts', 'alerts-sim-bulk.ndjson'))
    events_exist = os.path.exists(os.path.join(os.path.dirname(__file__), 'data', 'events', 'events-sim-bulk.ndjson'))
    intel_exist = os.path.exists(os.path.join(os.path.dirname(__file__), 'data', 'intel', 'intel-sim-bulk.ndjson'))
    kb_exist = os.path.exists(os.path.join(os.path.dirname(__file__), 'data', 'kb', 'kb-sim-bulk.ndjson'))
    
    if not (alerts_exist or events_exist or intel_exist or kb_exist):
        print("\n⚠️  샘플 데이터 파일이 없습니다. data/ 디렉토리에 JSON 파일을 추가한 후 다시 실행하세요.")
        return
    
    # 데이터 로드
    print("\n[데이터 로딩 시작]\n")
    
    if alerts_exist:
        print("\n📊 alerts-sim 인덱스 로딩...")
        load_alerts_data()
    
    if events_exist:
        print("\n📊 events-sim 인덱스 로딩...")
        load_events_data()
    
    if intel_exist:
        print("\n📊 intel-sim 인덱스 로딩...")
        load_intel_data()
    
    if kb_exist:
        print("\n📊 kb-sim 인덱스 로딩...")
        load_kb_data()
    
    print("\n" + "=" * 60)
    print("데이터 로딩 완료!")
    print("=" * 60)
    print("\n다음 인덱스들이 생성되었습니다:")
    print("  - alerts-sim-YYYY.MM.DD: 탐지 결과/알람 데이터")
    print("  - events-sim-YYYY.MM.DD: 컨텍스트 이벤트/행위 로그")
    print("  - intel-sim: Threat Intelligence 지표")
    print("  - kb-sim: RAG 문서/런북/플레이북")
    print("\n코파일럿이 이 데이터를 검색하여 답변을 생성합니다!")

if __name__ == "__main__":
    main()

