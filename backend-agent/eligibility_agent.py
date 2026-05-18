import os
import json
from typing import Annotated
from typing_extensions import TypedDict
from dotenv import load_dotenv

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AnyMessage
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from langchain.tools import tool
from langgraph.prebuilt import ToolNode

# ==========================================
# 0. 환경 변수 및 API 설정
# ==========================================
load_dotenv()
# LangGraph가 인식할 수 있도록 환경 변수에 강제 주입 (Mindlogic 게이트웨이 사용)
os.environ["ANTHROPIC_API_KEY"] = os.getenv("ANTHROPIC_AUTH_TOKEN", "sk-...")
os.environ["ANTHROPIC_BASE_URL"] = "https://factchat-cloud.mindlogic.ai/v1/gateway/claude"

# ==========================================
# 1. State 정의
# ==========================================
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    user_id: str
    policy_id: str

# ==========================================
# 2. 도구(Tool) 정의 - DB 조회 Mocking
# ==========================================
mock_policies_db = [
    {
        "policy_id": "V202600004",
        "category": "복지",
        "policy_name": "2026 서울청년문화패스",
        "region": "서울",
        "scity": None,
        "amin": 19,
        "amax": 22,
        "income": "건강보험료 본인부담금 기준 중위소득 150% 이하",
        "employment": None,
        "add_condition": None,
        "support_content": "연 20만원 문화관람비 (공연, 전시 등) 지원"
    },
    {
        "policy_id": "V202600002",
        "category": "금융",
        "policy_name": "2026 학자금대출 신용회복 지원사업",
        "region": "서울",
        "scity": None,
        "amin": 19,
        "amax": 39,
        "income": None,
        "employment": None,
        "add_condition": "학자금대출 신용도판단정보 등록자",
        "support_content": "초기 납입금 지원 및 신용정보 등록 해제"
    },
    {
        "policy_id": "gg_10054",
        "category": "복지",
        "policy_name": "2026년 「The 경기패스」 대중교통비 환급",
        "region": "경기",
        "scity": None,
        "amin": 19,
        "amax": 39,
        "income": None,
        "employment": None,
        "add_condition": "월 15회 이상 대중교통 이용자",
        "support_content": "대중교통 이용 시 K-패스 기본형 적용하여 교통비 환급"
    },
    {
        "policy_id": "gg_10051",
        "category": "주거",
        "policy_name": "청년 둥지론 전세자금 대출 이자 지원",
        "region": "경기",
        "scity": None,
        "amin": 19,
        "amax": 34,
        "income": "연소득 5천만원 이하",
        "employment": "재직",
        "add_condition": "경기도 내 전용면적 85㎡ 이하 주택 거주자",
        "support_content": "최대 4년간 전세자금 대출 이자 지원"
    },
    {
        "policy_id": "POL-TEST-05",
        "category": "복지",
        "policy_name": "2026년 서울시 청년수당",
        "region": "서울",
        "scity": None,
        "amin": 19,
        "amax": 34,
        "income": "중위소득 150% 이하",
        "employment": "미취업",
        "add_condition": "최종학력 졸업 후 2년 경과",
        "support_content": "월 50만원씩 최대 6개월 지급"
    },
    {
        "policy_id": "POL-TEST-06",
        "category": "일자리",
        "policy_name": "은평구 미취업 청년 자격증 응시료 지원",
        "region": "서울",
        "scity": "은평구",
        "amin": 19,
        "amax": 39,
        "income": None,
        "employment": "미취업",
        "add_condition": "공고일 기준 은평구 거주자",
        "support_content": "어학 및 국가공인자격증 응시료 실비 최대 10만원 지원"
    },
    {
        "policy_id": "POL-TEST-07",
        "category": "일자리",
        "policy_name": "중랑구 청년 예비 창업가 지원",
        "region": "서울",
        "scity": "중랑구",
        "amin": 19,
        "amax": 39,
        "income": None,
        "employment": None,
        "add_condition": "중랑구 거주 또는 활동하는 19~39세 예비 및 초기 창업가",
        "support_content": "창업 공간 임대료 보조 및 시제품 제작비 300만원 지원"
    },
    {
        "policy_id": "POL-TEST-08",
        "category": "복지",
        "policy_name": "서울시 여성장애인 홈헬퍼 파견",
        "region": "서울",
        "scity": None,
        "amin": None,
        "amax": None,
        "income": "저소득층",
        "employment": None,
        "disability": True,
        "gender": "여성",
        "support_content": "임신, 출산, 육아 기간 중 가사활동 및 외출 보조 홈헬퍼 파견"
    },
    {
        "policy_id": "POL-TEST-09",
        "category": "일자리",
        "policy_name": "경기도 청년면접수당",
        "region": "경기",
        "scity": None,
        "amin": 18,
        "amax": 39,
        "income": None,
        "employment": "구직",
        "add_condition": "올해 실제 면접에 참여한 사실이 증빙 가능한 자",
        "support_content": "1회 5만원, 최대 10회(연 50만원) 지역화폐 지급"
    },
    {
        "policy_id": "POL-TEST-10",
        "category": "주거",
        "policy_name": "청년월세 한시 특별지원 (국토부)",
        "region": "전국", # 지역 제한 없음
        "scity": None,
        "amin": 19,
        "amax": 34,
        "income": "원가구 중위소득 100% 이하 및 청년 독립가구 60% 이하",
        "employment": None,
        "add_condition": "보증금 5천만원 이하 및 월세 70만원 이하 주택 거주",
        "support_content": "월 최대 20만원씩 12개월 분할 지원"
    }
]

mock_user_profiles = [
    {
        "uid": "USER-999",
        "age": 24,
        "gender": "여성",
        "city": "서울",
        "scity": "관악구",
        "education": "대학 재학",
        "employment": "미취업",
        "disability": False,
        "income": 0,         # 소득 없음 (0원)
        "asset": "1천만원 이하"
    },
    {
        "uid": "USER-002",
        "age": 30,
        "gender": "남성",
        "city": "경기",
        "scity": "수원시",
        "education": "대학 졸업",
        "employment": "재직",
        "disability": False,
        "income": 4500,      # 연소득 4,500만 원
        "asset": "1억원 이하"
    },
    {
        "uid": "USER-003",
        "age": 28,
        "gender": "여성",
        "city": "서울",
        "scity": "은평구",
        "education": "고교 졸업",
        "employment": "미취업",
        "disability": True,
        "income": 1200,      # 연소득 1,200만 원 (저소득층 기준)
        "asset": "없음"
    },
    {
        "uid": "USER-004",
        "age": 38,
        "gender": "남성",
        "city": "서울",
        "scity": "중랑구",
        "education": "대학 졸업",
        "employment": "재직",
        "disability": False,
        "income": 8000,      # 연소득 8,000만 원 (고소득자)
        "asset": "3억원 이하"
    },
    {
        "uid": "USER-005",
        "age": 19,
        "gender": "여성",
        "city": "경기",
        "scity": "성남시",
        "education": "고교 졸업",
        "employment": "구직",
        "disability": False,
        "income": 600,       # 연소득 600만 원 (단기 알바 등)
        "asset": "5백만원 이하"
    }
]

@tool
def get_eligibility_data(user_id: str, policy_id: str) -> str:
    """DB에서 유저 프로필과 특정 정책의 상세 조건을 가져옵니다."""
    
    # 1. 유저 데이터 찾기
    user = next((u for u in mock_user_profiles if u['uid'] == user_id), None)
    # 2. 정책 데이터 찾기
    policy = next((p for p in mock_policies_db if p['policy_id'] == policy_id), None)
    
    if not user or not policy:
        return "해당 유저 또는 정책 정보를 찾을 수 없습니다."

    # 3. 두 데이터를 합쳐서 LLM이 비교하기 좋게 XML로 반환 (하드코딩 제거)
    return f"""<data>
    <user_profile>
        <age>{user['age']}</age>
        <region>{user['city']}</region>
        <scity>{user['scity']}</scity>
        <income>{user['income']}</income>
        <education>{user['education']}</education>
        <employment>{user['employment']}</employment>
        <disability>{user['disability']}</disability>
        <gender>{user['gender']}</gender>
    </user_profile>
    <policy_details>
        <policy_name>{policy['policy_name']}</policy_name>
        <amin>{policy['amin']}</amin>
        <amax>{policy['amax']}</amax>
        <region>{policy['region']}</region>
        <income>{policy.get('income', 'NULL')}</income>
        <employment>{policy.get('employment', 'NULL')}</employment>
        <add_condition>{policy.get('add_condition', 'NULL')}</add_condition>
    </policy_details>
</data>"""

tools = [get_eligibility_data]

# ==========================================
# 3. 모델 및 프롬프트 설정 (Temperature 0.0)
# ==========================================
model = ChatAnthropic(
    model="claude-sonnet-4-6",
    temperature=0.0 
).bind_tools(tools)

system_prompt = SystemMessage(content="""Role: Youth Policy Eligibility Checking Agent.
Task: Evaluate if the user is eligible for the specific policy.

<rules>
1. MUST use 'get_eligibility_data' tool with user_id and policy_id.
2. Evaluate ALL conditions: age, region, income, education, employment, add_condition.
3. Treat 'NULL' policy conditions as automatically passed.
4. [Income Rule]: User 'income' is an integer in 10,000 KRW units (e.g., 4500 = 45M KRW, 0 = no income). Logically compare this integer against the policy's text-based income limits.
5. Write 'reason' and 'missing_info' in KOREAN. Do NOT use any emojis.
6. [CRITICAL STRICT FORMAT] The VERY FIRST character of your output MUST be `<result>` and the VERY LAST string MUST be `</result>`. 
7. [CRITICAL STRICT FORMAT] NO conversational text, NO summaries, NO tables, NO emojis, NO greetings before or after the <result> tags. ONLY output the raw XML block.

<schema>
<result>
{
  "is_eligible": boolean,
  "reason": "Detailed explanation of pass/fail criteria in KOREAN. NO emojis.",
  "missing_info": ["List of missing info in KOREAN. Empty [] if none."]
}
</result>
</schema>
</rules>""")

def agent_node(state: AgentState):
    # State에 있는 user_id와 policy_id를 읽어옵니다.
    current_uid = state.get("user_id", "알수없음")
    current_pid = state.get("policy_id", "알수없음")
    
    # 💡 수정: AI가 유저에게 되묻지 못하도록 강력한 지시어(DO NOT ask) 추가
    dynamic_system_prompt = SystemMessage(
        content=system_prompt.content + f"""

[Context & CRITICAL INSTRUCTION]
Current user_id is '{current_uid}'.
Target policy_id is '{current_pid}'.
DO NOT ask the user for these IDs. You already have them. 
Execute the 'get_eligibility_data' tool IMMEDIATELY using these exact IDs.
"""
    )
    
    messages = [dynamic_system_prompt] + state["messages"]
    response = model.invoke(messages)
    
    return {"messages": [response]}

def should_continue(state: AgentState):
    """모델이 도구를 호출했는지, 최종 답변을 내렸는지 판단"""
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

# ==========================================
# 5. 그래프(StateGraph) 조립
# ==========================================
workflow = StateGraph(AgentState)

workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools)) # 도구 실행 노드

workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue, ["tools", END])
workflow.add_edge("tools", "agent")

app = workflow.compile()

# ==========================================
# 6. 실행 테스트
# ==========================================
if __name__ == "__main__":
    print("========== 자격 요건 확인 AI 판독 테스트 ==========\n")
    
    # [상황 설정] 현재 유저(USER-999)의 프로필 (Tool에 하드코딩된 내용 기준)
    # - 24세, 서울 관악구 거주, 미취업, 소득 6분위, 대학 재학

    # --------------------------------------------------
    # [Test 1] 서울시 청년수당 (POL-TEST-05)
    # --------------------------------------------------
    print("[유저 질문] 내가 '서울시 청년수당'을 받을 수 있을지 확인해줘.")
    
    test_1_input = {
        "messages": [HumanMessage(content="내가 '서울시 청년수당'을 받을 수 있을지 확인해줘.")],
        "user_id": "USER-999",
        "policy_id": "POL-TEST-05" 
    }
    result1 = app.invoke(test_1_input)
    
    print("[AI 판독 결과]")
    print(result1["messages"][-1].content)
    
    print("\n" + "="*50 + "\n")

    # --------------------------------------------------
    # [Test 2] 청년 둥지론 전세자금 (gg_10051)
    # --------------------------------------------------
    print("[유저 질문] 나 경기도 '청년 둥지론' 받을 수 있어?")
    
    test_2_input = {
        "messages": [HumanMessage(content="나 경기도 '청년 둥지론' 받을 수 있어?")],
        "user_id": "USER-003",
        "policy_id": "gg_10051" 
    }
    result2 = app.invoke(test_2_input)
    
    print("[AI 판독 결과]")
    print(result2["messages"][-1].content)