# pipeline/extract_schema.py

import time
import pandas as pd

from pipeline.ai_utils import ask_ollama_json


def safe_text(value) -> str:
    """
    pandas NaN, None, 숫자 등을 안전하게 문자열로 변환.
    """
    if pd.isna(value):
        return ""

    return str(value)


def extract_schema_from_file(input_path, output_path):
    df = pd.read_csv(input_path)

    results = []

    for idx, row in df.iterrows():
        title = safe_text(row.get("title") or row.get("policy_title"))
        raw_text = safe_text(row.get("raw_text"))

        print(f"[{idx + 1}/{len(df)}] 스키마 추출 중: {title}")

        if not raw_text.strip():
            result = {
                "source_site": row.get("source_site"),
                "source_name": row.get("source_name"),
                "policy_id": row.get("policy_id"),
                "policy_title": row.get("title") or row.get("policy_title"),
                "detail_url": row.get("detail_url"),
                "list_page": row.get("list_page"),

                # category metadata
                "source_category": row.get("source_category"),
                "schema_category": row.get("schema_category"),

                "crawl_status": row.get("crawl_status"),
                "crawl_reason": row.get("crawl_reason"),
                "ai_status": row.get("ai_status"),
                "ai_reason": row.get("ai_reason"),
                "ai_evidence": row.get("ai_evidence"),
                "error": "raw_text가 비어 있어 스키마 추출 불가",
            }

            results.append(result)
            print("실패: raw_text 없음")
            continue

        prompt = f"""
너는 청년정책 공고문을 DB 스키마에 맞게 추출하는 데이터 전처리기야.

아래 공고문에서 정보를 추출해서 반드시 JSON 객체 하나로만 답해.
마크다운 코드블록을 쓰지 마.
설명 문장을 쓰지 마.
중국어, 영어로 번역하지 말고 반드시 한국어로 답해.
값을 찾을 수 없으면 null을 넣어.
list나 dict를 만들지 말고, 모든 값은 string, number, boolean, null 중 하나로 넣어.

반드시 아래 필드만 사용해:
{{
  "title": string 또는 null,
  "amin": number 또는 null,
  "amax": number 또는 null,
  "region": string 또는 null,
  "scity": string 또는 null,
  "income": string 또는 null,
  "asset": string 또는 null,
  "education": string 또는 null,
  "employment": string 또는 null,
  "disability": boolean 또는 null,
  "gender": string 또는 null,
  "pstart": "YYYY-MM-DD" 또는 null,
  "pend": "YYYY-MM-DD" 또는 null,
  "ostart": "YYYY-MM-DD" 또는 null,
  "oend": "YYYY-MM-DD" 또는 null,
  "eligibility": string 또는 null,
  "add_condition": string 또는 null,
  "support_content": string 또는 null,
  "required_documents": string 또는 null,
  "application_method": string 또는 null
}}

추출 규칙:
- title은 정책명만 넣어.
- amin, amax는 연령 조건에서 숫자만 추출해. 예: 19, 39
- "연령무관", "제한없음"이면 amin, amax는 null로 넣어.
- region은 거주지 시/도 조건을 원문 기준으로 넣어.
- "전국", "제한없음", "거주지 제한없음"이면 region은 null로 넣어.
- "서울 거주", "서울특별시 거주"이면 region은 "서울특별시"로 넣어.
- "경기", "경기도"이면 region은 "경기도"로 넣어.
- "수도권"처럼 복수 지역이면 텍스트 그대로 넣어.
- scity는 구/군/시 단위만 넣어. 예: "중랑구", "은평구", "평택시"
- 전국 대상이거나 특정 구/군/시 조건이 없으면 scity는 null로 넣어.
- income은 소득 조건 원문을 요약 없이 넣어.
- "소득무관", "제한없음", "소득 제한 없음"이면 income은 null로 넣어.
- asset은 자산 조건 원문을 넣어. 없으면 null.
- education은 학력 조건을 넣어.
- "학력무관", "제한없음", "무관"이면 education은 null로 넣어.
- employment는 취업 상태 조건을 표준 레이블로 넣어.
  예: "미취업", "재직", "구직", "재학", "무관"
- "취업무관", "제한없음", 조건 없음이면 employment는 null로 넣어.
- disability는 장애인이 대상/우대/필수이면 true, 장애인 제외가 명확하면 false, 없거나 무관하면 null.
- gender는 "여성", "남성"처럼 제한이 명확할 때만 넣어.
- 성별 제한 없음, 무관, 조건 없음이면 gender는 null.
- pstart, pend는 신청기간만 넣어.
- ostart, oend는 사업운영기간만 넣어.
- 날짜는 반드시 YYYY-MM-DD 형식으로 넣어.
- "상시", "미정", "예정", "예산 소진 시까지"처럼 정확한 날짜가 아니면 해당 날짜 필드는 null.
- "연중" 운영기간은 해당 연도가 명확하면 ostart는 YYYY-01-01, oend는 YYYY-12-31로 넣어.
- eligibility는 제한 대상/기본 자격 요건 원문을 넣어.
  예: "중위소득 150% 이하", "서울 거주 미취업 청년", "대학 재학생"
- 명확한 자격 제한이 없으면 eligibility는 null.
- 사이트에 "제한없음"이라고 명시되어 있으면 eligibility는 "제한없음" 문자열로 넣어.
- add_condition은 eligibility 외의 추가 조건을 넣어.
  예: "타 사업 미수혜자", "과거 근로기간 총합 1년 이상", "병역 이행자는 최대 3세 연장"
- 추가 조건이 여러 개면 줄바꿈 대신 세미콜론(;)으로 이어붙여.
- support_content는 지원 내용 요약 문자열로 넣어.
- required_documents는 제출서류를 쉼표로 이어붙인 문자열로 넣어.
- application_method는 신청 방법을 문자열로 넣어.

정책 제목:
{title}

공고문:
{raw_text[:5000]}
"""

        try:
            extracted = ask_ollama_json(prompt)

            result = {
                "source_site": row.get("source_site"),
                "source_name": row.get("source_name"),
                "policy_id": row.get("policy_id"),
                "policy_title": row.get("title") or row.get("policy_title"),
                "detail_url": row.get("detail_url"),
                "list_page": row.get("list_page"),

                # category metadata
                "source_category": row.get("source_category"),
                "schema_category": row.get("schema_category"),

                "crawl_status": row.get("crawl_status"),
                "crawl_reason": row.get("crawl_reason"),
                "ai_status": row.get("ai_status"),
                "ai_reason": row.get("ai_reason"),
                "ai_evidence": row.get("ai_evidence"),

                "title": extracted.get("title") or title,
                "amin": extracted.get("amin"),
                "amax": extracted.get("amax"),
                "region": extracted.get("region"),
                "scity": extracted.get("scity"),
                "income": extracted.get("income"),
                "asset": extracted.get("asset"),
                "education": extracted.get("education"),
                "employment": extracted.get("employment"),
                "disability": extracted.get("disability"),
                "gender": extracted.get("gender"),
                "pstart": extracted.get("pstart"),
                "pend": extracted.get("pend"),
                "ostart": extracted.get("ostart"),
                "oend": extracted.get("oend"),
                "eligibility": extracted.get("eligibility"),
                "add_condition": extracted.get("add_condition"),

                # DB 핵심 스키마는 아니지만 검수/참고용으로 유지
                "support_content": extracted.get("support_content"),
                "required_documents": extracted.get("required_documents"),
                "application_method": extracted.get("application_method"),

                "error": None,
            }

            print("성공")

        except Exception as e:
            result = {
                "source_site": row.get("source_site"),
                "source_name": row.get("source_name"),
                "policy_id": row.get("policy_id"),
                "policy_title": row.get("title") or row.get("policy_title"),
                "detail_url": row.get("detail_url"),
                "list_page": row.get("list_page"),

                # category metadata
                "source_category": row.get("source_category"),
                "schema_category": row.get("schema_category"),

                "crawl_status": row.get("crawl_status"),
                "crawl_reason": row.get("crawl_reason"),
                "ai_status": row.get("ai_status"),
                "ai_reason": row.get("ai_reason"),
                "ai_evidence": row.get("ai_evidence"),
                "error": str(e),
            }

            print("실패:", e)

        results.append(result)
        time.sleep(0.5)

    result_df = pd.DataFrame(results)
    result_df.to_csv(output_path, index=False, encoding="utf-8-sig")

    print("저장 완료:", output_path)
    print("총 개수:", len(result_df))

    if "error" in result_df.columns:
        print("실패 개수:", result_df["error"].notna().sum())

    return result_df