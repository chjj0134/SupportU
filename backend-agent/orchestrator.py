from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
import os
import json
import re
from dotenv import load_dotenv

from welfare_policy_final import workflow as detection_workflow
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

# --- API 1: 사전 추천 연산 (유저가 접속/수정했을 때 백그라운드 구동) ---
class PrecomputeRequest(BaseModel):
    uid: str

@app.post("/api/orchestrator/precompute")
def run_precompute(req: PrecomputeRequest):
    uid = req.uid
    
    # 1. 유저 프로필 가져오기
    profile_res = supabase.table("user_profiles").select("*").eq("uid", uid).execute()
    if not profile_res.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    user_profile = profile_res.data[0]

    # 라우팅 (일자리/주거/복지 프롬프트 동적 주입)
    # 여기서는 welfare_policy_final.py를 활용한다고 가정합니다.
    # 카테고리별로 system_prompt를 갈아끼우면서 detection_workflow를 3번(또는 1번) 돌립니다.
    # detected_policies = run_detection_agents(user_profile)
    
    # 가상의 탐지 결과 (테스트용)
    detected_policies = ["POL-TEST-05", "V202600004"] 

    results = []
    for pid in detected_policies:
        # 자격 요건 검증 에이전트 (eligibility_agent) 가동
        # result = eligibility_workflow.invoke({"messages": [...], "user_id": uid, "policy_id": pid})
        # parsed_result = extract_json(result["messages"][-1].content)
        
        # 가상의 판독 결과 (테스트용)
        parsed_result = {"is_eligible": True, "reason": "나이와 소득 조건 충족"} 

        # Supabase에 'pending' 상태로 적재 (유저 UI 노출용)
        insert_data = {
            "uid": uid,
            "policy_id": pid,
            "apply_status": "pending",
            "apply_reason": parsed_result.get("reason", "검증 완료")
        }
        # cid 반환 확인
        db_res = supabase.table("user_calendar_events").insert(insert_data).select("cid").execute()
        results.append({"policy_id": pid, "cid": db_res.data[0]["cid"], "eligible": parsed_result.get("is_eligible")})

    return {"status": "success", "data": results}

# --- API 2: 실제 지원 처리 및 서류 추출 (유저가 '지금 지원' 클릭) ---
class ApplyRequest(BaseModel):
    uid: str
    policy_id: str
    cid: int

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