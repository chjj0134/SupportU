import os
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from dotenv import load_dotenv

# 1. 환경 변수 로드
load_dotenv()

# 2. OpenAI 클라이언트 초기화 (API 키를 주입)
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

system_prompt = """<Role>
Expert policy analyzer agent.
Task: Extract and personalize required document checklists from Korean youth policy documents based on user profiles. Do not evaluate eligibility.
</Role>

<Context>
- Target: Youth (age 19-39) in Seoul/Gyeonggi.
- Domain: Youth policies (Housing, Employment, Welfare).
- Inputs:
  1. Policy Document (Filtered core text).
  2. User Profile: Name, DOB, Location, Contact, Employment status, Tenure, Income, NHIS payment, Household size, Housing type, Lease status, Move-in date, Assets (Finance, Vehicle).
</Context>

<Tasks>
1. Extract all document requirements from the policy text, including conditions, validity periods, and submission methods.
2. Categorize documents by User Profile:
   - Required: Mandatory for all applicants.
   - Conditional (Applicable): Required specifically for this user. Write a 1-line reason.
   - Conditional (Not Applicable): Not required for this user. Write a 1-line reason.
   - Extract notes/cautions per document. Omit if none exist.
3. Provide issuing authority, online URL, and validity period for Required and Applicable Conditional documents.
</Tasks>

<Rules>
- Zero-fluff. Output facts only.
- Do not add documents not mentioned in the policy text.
- If a condition is uncertain, label as "사용자 확인 필요" (Requires User Confirmation) and state the necessary condition.
- Strictly apply the policy's specific rules for document format and validity.
- If multiple documents are accepted ("A or B"), prioritize the most accessible one based on the user profile.
- Omit unverified URLs or authorities.
- Do not output duplicate information.
- Provide links only in the link section. Do not add extra guides or explanations.
- Output EXACTLY in the provided OutputFormat.
- Answer in Korean.
</Rules>

반드시 아래의 JSON 형식으로만 출력하세요. 마크다운(` ```json ` 등)이나 어떠한 사족도 붙이지 마세요.
{
  "required_documents": ["신분증 사본", "주민등록등본"],
  "conditional_documents": [
    {"document": "임대차계약서", "reason": "월세 지원 신청자의 경우 필수"}
  ],
  "issuing_authority": "주민센터, 대법원 인터넷등기소",
  "notes": "주민등록번호 뒷자리는 반드시 마스킹 처리할 것"
}
"""

def run_filelist_agent(policy_url: str, user_profile_json: str) -> str:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    # 공고문 크롤링 로직 (url 변수를 policy_url 로 교체)
    try:
        response_web = requests.get(policy_url, headers=headers)
        response_web.raise_for_status()
        soup = BeautifulSoup(response_web.text, 'html.parser')
        
        # 텍스트만 추출하여 공백 정리
        policy_notice = soup.get_text(separator='\n', strip=True)
        print(f"[시스템] {policy_url} 텍스트 추출 완료.")
    except Exception as e:
        print(f"[시스템 오류] URL을 읽어오는 중 에러가 발생했습니다: {e}")
        policy_notice = "공고문 데이터를 불러오지 못했습니다."

    # OpenAI API 호출 (user_profile 변수를 user_profile_json 으로 교체)
    try:
        response = client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"""
다음 사용자 프로필과 정책 공고문을 분석하세요.

[사용자 프로필]
{user_profile_json}

[정책 공고문]
{policy_notice}
"""
                }
            ]
        )
        
        # print 대신 return으로 오케스트레이터에게 JSON 문자열을 return
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"[AI 분석 오류] 에러가 발생했습니다: {e}")
        return "{}" # 에러가 나더라도 서버가 터지지 않게 빈 JSON 반환