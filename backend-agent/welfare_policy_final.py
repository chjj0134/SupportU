import json
import os
import anthropic
from typing import Annotated
from typing_extensions import TypedDict
from dotenv import load_dotenv

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AnyMessage
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt
from langchain.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import ToolNode

# 환경 변수 로드
load_dotenv()
os.environ["ANTHROPIC_API_KEY"] = os.getenv("ANTHROPIC_AUTH_TOKEN", "키_오류")
os.environ["ANTHROPIC_BASE_URL"] = "https://factchat-cloud.mindlogic.ai/v1/gateway/claude"

# ==========================================
# 1. State 정의
# ==========================================
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    user_id: str
    user_profile: dict

# ==========================================
# 2. 도구(Tool) 정의 - 카테고리 기능 추가
# ==========================================
# 파일 상단에 mock_policies_db 리스트를 붙여넣으세요.
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
def search_policies_in_db(region: str, age: int, category: str = "전체") -> str:
    """Search for policies in DB based on profile. 'category' is one of [주거, 일자리, 복지, 전체]"""
    matched = []
    for p in mock_policies_db:
        region_match = (p['region'] == "전국" or p['region'] == region)
        min_age = p['amin'] if p['amin'] is not None else 0
        max_age = p['amax'] if p['amax'] is not None else 999
        age_match = (min_age <= age <= max_age)
        cat_match = (category == "전체" or p['category'] == category)
        
        if region_match and age_match and cat_match:
            matched.append(p)

    if not matched: return "No matching policies found."

    res = "<policies>"
    for m in matched:
        res += f"\n  <policy><id>{m['policy_id']}</id><name>{m['policy_name']}</name><content>{m['support_content']}</content></policy>"
    res += "\n</policies>"
    return res

tools = [search_policies_in_db]

# ==========================================
# 3. 모델 설정
# ==========================================
model = ChatAnthropic(
    model="claude-sonnet-4-6",
    temperature=0.0 
).bind_tools(tools)

# ==========================================
# 4. 노드(Node) 및 흐름 제어 정의
# ==========================================
def agent_node(state: AgentState):
    uid = state.get("user_id")
    profile = next((u for u in mock_user_profiles if u['uid'] == uid), None)
    
    if not profile:
        return {"messages": [HumanMessage(content="사용자 프로필을 찾을 수 없습니다.")]}

    system_prompt = SystemMessage(content=f"""Role: Youth Policy Detection Agent.
Task: Recommend suitable policies from DB using the provided User Profile.

User Profile: {json.dumps(profile, ensure_ascii=False)}

<rules>
1. MUST use 'search_policies_in_db' tool. Extract 'category' intent from user message.
2. Filter policies strictly by age and region in the profile.
3. If profile doesn't have enough info for specific policy conditions, still include it but note that further check is needed.
4. Write 'reason' in KOREAN. Do NOT use emojis.
5. [STRICT FORMAT] VERY FIRST char MUST be `<result>` and VERY LAST string MUST be `</result>`.
6. [STRICT FORMAT] Zero-fluff. NO greetings, NO summaries, NO conversational text.
</rules>

<schema>
<result>
{{
  "recommended_policies": [
    {{"policy_id": "...", "policy_name": "...", "reason": "Reason in KOREAN. NO emojis."}}
  ]
}}
</result>
</schema>""")

    messages = [system_prompt] + state["messages"]
    response = model.invoke(messages)
    return {"messages": [response], "user_profile": profile}

def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

# ==========================================
# 5. 그래프 조립
# ==========================================
workflow = StateGraph(AgentState)

workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))

workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue, ["tools", END])
workflow.add_edge("tools", "agent")

memory = InMemorySaver()
app = workflow.compile(checkpointer=memory)

# ==========================================
# 6. 실행 테스트 시나리오
# ==========================================
if __name__ == "__main__":
    print("========== 프로필 기반 정책 탐지 테스트 ==========\n")
    
    # 필수: LangGraph 메모리가 기억할 수 있도록 '대화방 번호(thread_id)'를 지정해 줍니다.
    config = {"configurable": {"thread_id": "test_thread_01"}}
    
    # USER-999 (서울, 24세)가 복지 정책을 찾는 상황
    test_input = {
        "messages": [HumanMessage(content="나한테 맞는 복지 정책 다 찾아줘.")],
        "user_id": "USER-999"
    }
    
    # config를 함께 넘겨줍니다.
    result = app.invoke(test_input, config=config)
    
    print("[AI 판독 결과]")
    print(result["messages"][-1].content)