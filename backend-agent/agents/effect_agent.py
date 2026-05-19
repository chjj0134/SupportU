import os
import json
from typing import Annotated
from typing_extensions import TypedDict
from dotenv import load_dotenv

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AnyMessage
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END

# 0. 환경 변수 및 API 설정
load_dotenv()
os.environ["ANTHROPIC_API_KEY"] = os.getenv("ANTHROPIC_AUTH_TOKEN", "키_오류")
os.environ["ANTHROPIC_BASE_URL"] = "https://factchat-cloud.mindlogic.ai/v1/gateway/claude"

# ==========================================
# 1. State
# ==========================================
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    user_id: str

# 시스템 프롬프트
SYSTEM_PROMPT = """Role: Expert Youth Policy Benefit Analyst.
Task: Analyze user benefits.
- IF provided a single policy: Perform detailed benefit analysis.
- IF provided a list of multiple policies: Synthesize them into a total benefit summary.

Instructions:
1. Review the <user_data> provided.
2. If multiple policies exist, aggregate monetary and non-monetary benefits.
3. Provide a concise, professional summary.
4. Output as pure JSON (no markdown).
5. Answer in Korean.

Output JSON Schema:
{
  "total_cash_benefit": "Sum or description",
  "total_service_benefit": "Integrated description",
  "final_summary": "One-sentence comprehensive conclusion in KOREAN."
}
"""

# 모델 설정 (Claude 4.6 Sonnet, 정밀 분석을 위해 온도는 0.0)
model = ChatAnthropic(
    model="claude-sonnet-4-6", 
    temperature=0.0, 
    max_tokens=1024
)

# 4. 분석 노드
def analyze_benefits(state: AgentState):
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = model.invoke(messages)
    return {"messages": [response]}

# 5. 그래프 조립
workflow = StateGraph(AgentState)
workflow.add_node("analyzer", analyze_benefits)
workflow.add_edge(START, "analyzer")
workflow.add_edge("analyzer", END)

app = workflow.compile()