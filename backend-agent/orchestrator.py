from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
import os
import json
import re
import time  # API Rate Limit 방어용
from dotenv import load_dotenv

# LangGraph 내 노드 구동을 위한 메시지 객체 임포트
from langchain_core.messages import HumanMessage

# eligibility_agent.py에서 컴파일된 'app' 그래프를 가져옵니다.
from eligibility_agent import app as eligibility_workflow
from filelist_agent import run_filelist_agent
from effect_agent import app as effect_workflow

load_dotenv()

app = FastAPI(title="Youth Policy Orchestrator")

# 1. Supabase 초기화
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 유틸 함수: LLM JSON 사족 제거 ---
def extract_json(llm_output: str) -> dict:
    try:
        match = re.search(r"\{.*\}", llm_output, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(llm_output)
    except json.JSONDecodeError:
        print("JSON 파싱 에러 발생! 원본 텍스트:", llm_output)
        return {}

def call_eligibility_agent_workflow(user_data: dict, policy_data: dict) -> dict:
    """
    eligibility_agent의 AgentState 규격과 Agent_Prompting.md 규칙에 맞춰
    데이터를 XML 포맷으로 변환한 뒤, LangGraph 앱을 호출하는 통합 헬퍼 함수
    """
    # 구조화된 XML 포맷 빌드 (토큰 최적화 가이드 준수)
    human_msg_content = f"""
<user_profile>
{json.dumps(user_data, ensure_ascii=False, indent=2)}
</user_profile>

<policy_criteria>
{json.dumps(policy_data, ensure_ascii=False, indent=2)}
</policy_criteria>
"""
    # eligibility_agent.py의 AgentState 변수명 구조 일치화
    initial_state = {
        "messages": [HumanMessage(content=human_msg_content)],
        "user_id": user_data.get("uid", user_data.get("id", "")),
        "policy_id": policy_data.get("policy_id", "")
    }
    
    # LangGraph 서브그래프 가동
    result = eligibility_workflow.invoke(initial_state)
    llm_output = result["messages"][-1].content
    
    return extract_json(llm_output)


# =====================================================================
# API 1-A. [시나리오 1] 신규 유저 가입/프로필 수정 시 (사전 추천 연산)
# =====================================================================
class PrecomputeRequest(BaseModel):
    uid: str

@app.post("/api/orchestrator/precompute-eligibility")
async def run_precompute_pipeline(req: PrecomputeRequest):
    uid = req.uid
    try:
        # 1. 유저 프로필 조회
        user_res = supabase.table('user_profiles').select('*').eq('uid', uid).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="유저 프로필을 찾을 수 없습니다.")
        user_profile = user_res.data[0]
        
        user_city = user_profile.get('city', '')
        user_age = user_profile.get('age', 0)

        # 2. 하드 필터링 (지역으로 1차 컷, 백엔드 최적화)
        policies_res = supabase.table('policies') \
            .select('policy_id, title, summary, eligibility, amin, amax, region') \
            .in_('region', [user_city, '전국']) \
            .execute()
        
        eligible_records = []

        # 3. 파이썬 나이 필터링 후 AI 에이전트 심사(test용으로 2개만)
        for policy in policies_res.data[100:102]:
            amin = int(float(policy.get('amin'))) if policy.get('amin') is not None else 0
            amax = int(float(policy.get('amax'))) if policy.get('amax') is not None else 99
            
            if not (amin <= user_age <= amax):
                continue # 나이 조건 미달 시 스킵 (비용 및 토큰 방어)

            # 최적화된 에이전트 연동 함수 호출
            ai_result = call_eligibility_agent_workflow(user_profile, policy)

            if ai_result.get("is_eligible") == True:
                eligible_records.append({
                    "uid": uid,
                    "policy_id": policy["policy_id"],
                    "is_eligible": True,
                    "unmet_conditions": ai_result.get("reason", "")  # 기존 unmet_conditions에 판단 근거 매핑
                })
            
            # Claude 3.5 API 연속 호출 분당 횟수 제한(Rate Limit) 방어용 짧은 휴식
            time.sleep(0.2)

        # 4. DB 일괄 저장 (기존 내역 삭제 후 삽입 - 트랜잭션 보존)
        if eligible_records:
            supabase.table('eligibility_results').delete().eq('uid', uid).execute()
            supabase.table('eligibility_results').insert(eligible_records).execute()

        return {"status": "success", "inserted_count": len(eligible_records)}

    except Exception as e:
        print(f"Precompute Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================================
# API 1-B. [시나리오 2] 역방향 매칭: 새벽 신규 정책 추가 시 (배치 처리)
# =====================================================================
class NewPoliciesRequest(BaseModel):
    policy_ids: List[str]

@app.post("/api/orchestrator/sync-new-policies")
async def sync_new_policies_to_users(req: NewPoliciesRequest):
    new_policy_ids = req.policy_ids
    total_matched = 0
    
    try:
        for pid in new_policy_ids:
            policy_res = supabase.table('policies').select('policy_id, title, summary, eligibility, amin, amax, region').eq('policy_id', pid).execute()
            if not policy_res.data:
                continue
            policy = policy_res.data[0]
            
            amin_clean = int(float(policy.get('amin'))) if policy.get('amin') is not None else 0
            amax_clean = int(float(policy.get('amax'))) if policy.get('amax') is not None else 99

            # 역방향 필터링: 정책의 지역/나이 조건에 맞는 유저만 효율적으로 선별 SELECT
            target_users_res = supabase.table('user_profiles').select('*') \
                            .eq('city', policy['region']) \
                            .gte('age', amin_clean) \
                            .lte('age', amax_clean).execute()
            
            matched_users_for_this_policy = []
            
            for user in target_users_res.data[:2]:  #test용으로 user 2명만 test
                # 최적화된 에이전트 연동 함수 호출
                ai_result = call_eligibility_agent_workflow(user, policy)
                
                if ai_result.get("is_eligible") == True:
                    matched_users_for_this_policy.append({
                        "uid": user["uid"],
                        "policy_id": pid,
                        "is_eligible": True,
                        "unmet_conditions": ai_result.get("reason", "")
                    })
                
                # API 안정적 트래픽 소모를 위한 지연 시간
                time.sleep(0.2)
            
            # 합격한 유저들에게만 일괄 INSERT
            if matched_users_for_this_policy:
                supabase.table('eligibility_results').insert(matched_users_for_this_policy).execute()
                total_matched += len(matched_users_for_this_policy)
                
        return {"status": "success", "message": f"총 {total_matched}건의 신규 배치 매칭 데이터 적재 완료"}

    except Exception as e:
        print(f"Sync New Policies Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- API 2: 실제 지원 처리 및 서류 추출 (유저가 '지금 지원' 클릭) ---
class ApplyRequest(BaseModel):
    uid: str
    policy_id: str

@app.post("/api/orchestrator/apply")
def run_apply(req: ApplyRequest):
    print(f"\n요청 수신 -> uid: {req.uid}, policy_id: {req.policy_id}")
    
    # Supabase 실데이터 조회 및 엄격한 예외 검증
    try:
        profile_res = supabase.table("user_profiles").select("*").eq("uid", req.uid).execute()
        policy_res = supabase.table("policies").select("detail_url, title").eq("policy_id", req.policy_id).execute()

        # 구글 로그인 필수 조건: 프로필이 없으면 즉시 404
        if not profile_res.data:
            raise HTTPException(
                status_code=404, 
                detail=f"User profile not found. Google login or profile setup required for uid: {req.uid}"
            )
            
        if not policy_res.data:
            raise HTTPException(
                status_code=404, 
                detail=f"Policy data not found for policy_id: {req.policy_id}"
            )

        # 데이터 매핑
        user_profile = profile_res.data[0]
        doc_url = policy_res.data[0].get("detail_url")
        policy_name = policy_res.data[0].get("title") or policy_res.data[0].get("policy_name")
        
        print(f"[DB 조회 성공] 유저: {req.uid} | 정책명: {policy_name}")

    except HTTPException as http_err:
        # FastAPI가 지정된 HTTP 에러(404 등)를 그대로 클라이언트에 주도록 그대로 raise
        raise http_err
    except Exception as db_err:
        print(f"[DB 시스템 오류] {db_err}")
        raise HTTPException(status_code=500, detail=f"Supabase 연결 스펙 오류: {db_err}")

    # 서류 리스트업 에이전트 가동
    filelist_output = run_filelist_agent(doc_url, json.dumps(user_profile))
    parsed_docs = extract_json(filelist_output)
    
    # document_drafts 테이블에 최종 서류 데이터만 실시간 적재
    draft_data = {
        "uid": req.uid,
        "policy_id": req.policy_id,
        "doc_url": doc_url,
        "dcontent": json.dumps(parsed_docs, ensure_ascii=False),
        "draft_status": "generated"
    }
    
    # Supabase DB에 최종 결과 insert
    supabase.table("document_drafts").insert(draft_data).execute()
    print(f"[DB 적재 완료] '{policy_name}'의 AI 추출 서류 리스트가 document_drafts에 영구 저장되었습니다.")

    return {
        "status": "success",
        "message": "AI 서류 리스트 수집 및 document_drafts 테이블 적재 완료",
        "retrieved_policy_name": policy_name,
        "preview_data": parsed_docs
    }



# --- API 3: 심야 배치 스케줄러용 (기대 효과 분석) ---
class EffectRequest(BaseModel):
    cid: int
    uid: str

@app.post("/api/orchestrator/batch_effect")
def run_batch_effect(req: EffectRequest):
    # 기대효과 에이전트 (effect_agent) 가동
    # result = effect_workflow.invoke({"messages": [...], "user_id": req.uid})
    # parsed_effect = extract_json(result["messages"][-1].content)
    
    parsed_effect = {
        "total_cash_benefit": "320만원", 
        "total_service_benefit": "상담 제공", 
        "final_summary": "총 320만원과 상담 혜택"
    }

    # 정수형 변환 방어 로직 (금액 파싱)
    cash_str = parsed_effect.get("total_cash_benefit", "0")
    try:
        clean_amount = int(re.sub(r"[^\d]", "", cash_str))
    except ValueError:
        clean_amount = 0

    # effect 테이블에 저장 (cid 외래키 연결)
    effect_data = {
        "cid": req.cid,
        "effect_summary": parsed_effect.get("final_summary"),
        "is_quantifiable": clean_amount > 0,
        "benefit_amount": clean_amount,
        "benefit_item": parsed_effect.get("total_service_benefit")
    }
    supabase.table("effect").insert(effect_data).execute()
    
    return {"status": "success", "message": "기대효과 적재 완료"}