import anthropic
from dotenv import load_dotenv
import os
import json

# ② .env에서 API 키 로드
load_dotenv()
client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_AUTH_TOKEN"),
    base_url="https://factchat-cloud.mindlogic.ai/v1/gateway/claude", # 사용하시는 서버의 base_url 적용
)

# 1. 실제 DB 연동 API를 대체하는 가상(Mock) 함수
def get_user_applied_policies_benefits_mock(user_id):
    print(f"\n[시스템 진행상황] 가상 DB 조회 중... 사용자 '{user_id}'의 신청 정책 목록 및 혜택 조회")
    # 실제 프로젝트에서는 백엔드에서 user_id를 바탕으로 DB를 조회하여 아래와 같이 XML로 가공해 반환합니다.
    return """<applied_policies>
  <policy>
    <name>2026년 서울시 청년 월세 지원</name>
    <financial_benefit>월 20만원 지원 (최대 12개월, 총 240만원)</financial_benefit>
    <category>주거/생활</category>
  </policy>
  <policy>
    <name>청년 국가기술자격증 지원 사업</name>
    <financial_benefit>1회성 비용 10만원 지원</financial_benefit>
    <category>교육/취업</category>
  </policy>
</applied_policies>"""

# 2. Claude에게 제공할 도구(Tool) 명세서
tools = [
    {
        "name": "get_user_applied_policies_benefits",
        "description": "Fetch the financial and qualitative benefits of policies the user applied for.",
        "input_schema": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "혜택을 조회할 사용자 ID"}
            },
            "required": ["user_id"]
        }
    }
]

# 3. 시스템 프롬프트 설정 (토큰 최적화 가이드 반영)
system_prompt = """Role: Policy Impact Analyst.
Task: Calculate and summarize the combined financial and qualitative benefits of the youth policies the user has applied for.

<rules>
1. Do not hallucinate. Base your analysis ONLY on the provided <applied_policies>.
2. Be concise. Omit conversational fillers.
3. Calculate the exact total maximum financial benefit in KRW.
4. Categorize the expected effects into 'financial_stability' and 'career_growth'.
5. Output the result in strictly valid JSON format.
6. All string values in the JSON output MUST be in Korean.
</rules>"""

# 4. 대화 기록 초기화 및 첫 번째 질문 세팅 (JSON 스키마 지시 포함)
user_id = "user123"
user_instruction = f"""사용자 '{user_id}'가 지금까지 신청한 청년 정책 혜택을 모두 받을 경우의 기대효과를 분석해줘.

<instruction>
Analyze the total expected effects if the user receives all the benefits from the applied policies.
Return the result following the exact JSON schema below:

{{
  "total_financial_benefit_krw": integer (Total maximum amount),
  "summary_message": "string (1-2 lines summarizing the overall impact)",
  "effects": {{
    "financial_stability": ["string (bullet points)"],
    "career_growth": ["string (bullet points)"]
  }}
}}
</instruction>"""

messages = [
    {"role": "user", "content": user_instruction}
]

print("Claude에게 첫 번째 요청을 보냅니다...")

# 5. 첫 번째 API 호출 (도구 사용 여부 판단)
response = client.messages.create(
    model="claude-haiku-4-5-20251001", # 요청하신 클로드 소넷 모델 사용
    max_tokens=1024,
    temperature=0.0, # 계산 및 정확한 JSON 출력을 위해 0.0 설정
    system=system_prompt,
    tools=tools,
    messages=messages
)

# 6. Claude가 도구(Tool)를 사용하기로 결정했는지 확인
if response.stop_reason == "tool_use":
    # Claude가 응답한 내용 중 'tool_use' 블록을 찾습니다.
    tool_use = next(block for block in response.content if block.type == "tool_use")
    tool_name = tool_use.name
    tool_input = tool_use.input
    tool_id = tool_use.id

    print(f"\n[Claude의 판단] '{tool_name}' 도구를 사용하기로 결정했습니다.")
    print(f"[Claude가 추출한 인자값] {tool_input}")

    # 7. 로컬 환경에서 실제 함수 실행
    if tool_name == "get_user_applied_policies_benefits":
        # 앞서 정의한 가상 함수에 Claude가 준 인자값을 넣어 실행합니다.
        policy_data = get_user_applied_policies_benefits_mock(tool_input["user_id"])
    
    # 8. 매우 중요: Claude의 도구 사용 요청을 대화 기록에 추가
    messages.append({"role": "assistant", "content": response.content})
    
    # 9. 도구 실행 결과(policy_data)를 대화 기록에 추가
    messages.append({
        "role": "user",
        "content": [
            {
                "type": "tool_result",
                "tool_use_id": tool_id,
                "content": policy_data # 함수 실행 결과 (XML 데이터)
            }
        ]
    })

    print("\n[시스템 진행상황] 도구 실행 결과를 Claude에게 전달하여 최종 분석 결과(JSON) 생성을 요청합니다...")
    
    # 10. 결과를 포함하여 두 번째 API 호출 (최종 JSON 답변 받기)
    final_response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        temperature=0.0,
        system=system_prompt,
        tools=tools,
        messages=messages
    )
    
    print("\n=== 🤖 Claude의 최종 답변 (기대효과 JSON) ===")
    final_text = final_response.content[0].text
    print(final_text)
    
    # 파싱 테스트 (실제 프론트엔드 연동용)
    print("\n=== 프론트엔드 연동용 JSON 파싱 테스트 ===")
    try:
        parsed_json = json.loads(final_text)
        print("✅ 파싱 성공! 파싱된 객체 타입:", type(parsed_json))
    except json.JSONDecodeError:
        print("🚨 JSON 파싱 에러 발생")

else:
    # 도구를 사용하지 않고 바로 대답한 경우
    print("\n=== 🤖 Claude의 답변 ===")
    print(response.content[0].text)