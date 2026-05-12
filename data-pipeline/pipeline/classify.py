# pipeline/classify.py

import time
import pandas as pd

from config import TODAY
from pipeline.ai_utils import ask_ollama_json


def safe_text(value) -> str:
    """
    pandas NaN, None, 숫자 등을 안전하게 문자열로 변환.
    """
    if pd.isna(value):
        return ""

    return str(value)


def classify_need_check_file(input_path, output_path):
    df = pd.read_csv(input_path)

    results = []
    date_str = TODAY.strftime("%Y-%m-%d")

    for idx, row in df.iterrows():
        title = safe_text(row.get("title") or row.get("policy_title"))
        raw_text = safe_text(row.get("raw_text"))

        print(f"[{idx + 1}/{len(df)}] need_check 재분류 중: {title}")

        # raw_text가 아예 없으면 Ollama 호출하지 않고 uncertain 처리
        if not raw_text.strip():
            result = row.to_dict()
            result["ai_status"] = "uncertain"
            result["ai_reason"] = "raw_text가 비어 있어 자동 판단 불가"
            result["ai_evidence"] = ""
            result["ai_error"] = None

            results.append(result)
            print("결과: uncertain / raw_text 없음")
            continue

        prompt = f"""
너는 청년정책 공고문을 현재 날짜 기준으로 분류하는 데이터 검수기야.

현재 날짜는 {date_str} 이야.

아래 정책이 현재 날짜 기준으로 신청 가능하거나 이용 가능한 정책인지 판단해.

반드시 JSON 객체 하나로만 답해.
마크다운 코드블록 쓰지 마.
설명 문장 쓰지 마.
한국어로 답해.

반드시 아래 필드만 사용해:
{{
  "status": "active" 또는 "closed" 또는 "uncertain",
  "reason": string,
  "evidence": string
}}

판단 기준:
- active: 현재 신청 가능, 이용 가능, 운영 중, 상시, 연중, 예산 소진 시까지, 모집 중인 정책
- closed: 신청기간/모집기간/운영기간이 현재 날짜보다 명확히 지났거나, 마감/종료된 정책
- uncertain: 날짜 정보가 부족하거나, 운영 여부가 애매해서 자동 판단이 어려운 정책

정책 제목:
{title}

공고문:
{raw_text[:4500]}
"""

        try:
            classified = ask_ollama_json(prompt)

            result = row.to_dict()
            result["ai_status"] = classified.get("status")
            result["ai_reason"] = classified.get("reason")
            result["ai_evidence"] = classified.get("evidence")
            result["ai_error"] = None

            print("결과:", result["ai_status"])

        except Exception as e:
            result = row.to_dict()
            result["ai_status"] = "uncertain"
            result["ai_reason"] = "AI 분류 실패"
            result["ai_evidence"] = ""
            result["ai_error"] = str(e)

            print("실패:", e)

        results.append(result)
        time.sleep(0.5)

    result_df = pd.DataFrame(results)
    result_df.to_csv(output_path, index=False, encoding="utf-8-sig")

    print("저장 완료:", output_path)

    if "ai_status" in result_df.columns:
        print(result_df["ai_status"].value_counts(dropna=False))

    return result_df