import os
import requests

from bs4 import BeautifulSoup

from openai import OpenAI

from dotenv import load_dotenv


# =========================================================
# 환경 변수 로드
# =========================================================

load_dotenv()


# =========================================================
# OpenAI Client
# =========================================================

api_key = os.getenv(
    "OPENAI_API_KEY"
)

client = OpenAI(
    api_key=api_key
)


# =========================================================
# System Prompt
# =========================================================

system_prompt = """
<Role>
Expert Korean policy document extraction agent.
Task: Extract structured application document requirements from Korean youth policy texts.
</Role>

<Context>
- Domain: Korean youth policies (Housing, Employment, Welfare).
- Input:
  1. Policy document text.
</Context>

<Tasks>
1. Extract application document requirements from the policy text.
2. Identify:
   - document name
   - whether it is mandatory
   - concise submission guide
   - official reference URL if explicitly provided
3. Return concise and structured outputs only.
</Tasks>

<Rules>
- Output facts only.
- Prioritize explicitly mentioned documents.
- Conservative inference allowed only for strongly implied government documents.
- Do not hallucinate unsupported documents.
- Use concise Korean document names.
- Avoid duplicates.
- Keep doc_guide within 1 sentence.
- Return ONLY raw JSON.
- Never use markdown code fences.
- Extract only applicant submission documents.
- Never return the policy notice itself as a document.
- Ignore menus, navigation text, and unrelated website content.
</Rules>

반드시 아래 JSON 형식만 출력하세요.

{
  "documents": [
    {
      "doc_name": "주민등록등본",
      "is_required": true,
      "doc_guide": "모든 신청자 제출",
      "doc_url": null
    }
  ]
}
"""


# =========================================================
# Document Extraction Agent
# =========================================================

def run_document_extraction_agent(
    policy_url: str
) -> str:

    headers = {

        "User-Agent":
            "Mozilla/5.0"
    }

    # =====================================================
    # 정책 공고문 크롤링
    # =====================================================

    try:

        response_web = requests.get(

            policy_url,

            headers=headers,

            timeout=15
        )

        response_web.raise_for_status()

        soup = BeautifulSoup(

            response_web.text,

            "html.parser"
        )

        # 전체 텍스트 추출
        policy_notice = soup.get_text(

            separator="\n",

            strip=True
        )

        # 너무 긴 HTML 방지
        policy_notice = policy_notice[:25000]

        print(
            f"[SYSTEM] Policy text extracted: {policy_url}"
        )

    except Exception as e:

        print(
            f"[SYSTEM ERROR] Crawling failed: {e}"
        )

        return """
{
  "documents": []
}
"""

    # =====================================================
    # OpenAI 호출
    # =====================================================

    try:

        response = client.chat.completions.create(

            model="gpt-5-mini",

            messages=[

                {

                    "role":
                        "system",

                    "content":
                        system_prompt
                },

                {

                    "role":
                        "user",

                    "content":
f"""
당신은 실제 정책 신청자의
제출서류 준비를 돕는 담당자입니다.

아래 정책 공고문을 읽고,
신청자가 실제로 제출해야 하는
문서를 추출하세요.

정책 설명이나 공고문 자체는
문서로 반환하지 마세요.

[정책 공고문]
{policy_notice}
"""
                }
            ]
        )
        print(policy_notice[:5000])
        result = response.choices[
            0
        ].message.content

        return result

    except Exception as e:

        print(
            f"[AI ERROR] {e}"
        )

        return """
{
  "documents": []
}
"""