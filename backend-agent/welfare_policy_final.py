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