# 🤖 멀티모달 에이전트 프롬프팅 가이드 (Token Optimization)

본 가이드는 OpenAI(GPT)와 Anthropic(Claude) 모델을 활용하여 에이전트를 구축할 때, 성능은 유지하면서 API 토큰(비용 및 응답 속도)을 최소화하기 위한 팀 내 프롬프트 작성 표준입니다.

## 1. 🪙 토큰 절약을 위한 4대 공통 원칙

### ① 예의 바른 표현 생략 (Zero-fluff)
LLM에게 부탁하거나 감사할 필요가 없습니다. 불필요한 수식어는 모두 토큰 낭비입니다.
- ❌ Bad: "안녕! 너는 지금부터 유능한 정책 분석가야. 내가 주는 데이터를 보고 자격 조건이 되는지 알려줄 수 있을까? 부탁할게!"
- ⭕ Good: "Role: 정책 분석가. Task: 주어진 데이터 기반 유저 자격 조건 판별."

### ② 시스템 프롬프트는 가급적 '영어'로 작성
한국어는 영어에 비해 토큰을 약 2~2.5배 더 많이 소모합니다. 사용자 입력(Korean)은 그대로 두더라도, System Prompt와 Tool Description은 영어로 작성하는 것이 토큰 절약에 매우 유리합니다.
- 💡 Tip: 지시는 영어로 하되, `Answer in Korean.` 한 줄만 추가하면 완벽하게 한국어로 대답합니다.

### ③ 구조화된 포맷 사용 (Markdown, XML)
자연어로 길게 설명하는 것보다 구조화된 포맷을 사용하면 모델이 파싱하기도 쉽고 토큰도 적게 듭니다.
- GPT: Markdown (`###`, `-`) 또는 JSON 포맷 선호
- Claude: XML 태그 (`<context>`, `<instruction>`) 선호 (Anthropic 공식 권장)

### ④ RAG 데이터 전처리 (Garbage In, Garbage Out)
온통청년, 복지로 API 등에서 가져온 정책 데이터를 프롬프트에 주입(Injection)할 때, 사용하지 않는 Null 값이나 불필요한 메타데이터(예: 정책 등록일, 담당자 연락처 등)는 백엔드(FastAPI) 단에서 미리 필터링하고 핵심 데이터만 넘겨야 합니다.

---

## 2. 🧠 모델별 최적화 전략 (GPT vs Claude)

### 🔵 OpenAI (GPT-4o 등)
- System Prompt 의존성: GPT는 System Prompt의 규칙을 매우 잘 따릅니다. 페르소나와 제약조건은 모두 System 영역에 몰아넣으세요.
- JSON 모드/Structured Outputs: 출력 포맷이 일정해야 하는 에이전트(예: 서류 리스트 추출, 자격 검증 결과 JSON 반환)의 경우, 프롬프트로 강제하기보다 API의 `response_format`을 활용하는 것이 토큰과 에러율을 줄입니다.

### 🟠 Anthropic (Claude 3.5 Sonnet 등)
- XML 태그 활용 필수: Claude는 컨텍스트가 길어질 때 XML 태그로 영역을 구분해주면 이해도가 급상승합니다.
- 순서의 중요성: Claude API는 `user` - `assistant` - `user`의 메시지 교차 규칙이 엄격합니다.
- 온도(Temperature) 설정 주의: OpenAI는 2.0까지 지원하지만, Claude는 0.0 ~ 1.0 입니다. 에이전트의 판단(자격 검증 등) 로직에서는 0.0에 가깝게 설정하세요.

---

## 3. 🛠️ 에이전트 도구(Tool / Function Calling) 명세서 작성법

에이전트가 호출할 함수(예: `get_policy_details`, `search_weather`)의 Description을 어떻게 적느냐가 토큰 사용량과 에이전트 자율성에 큰 영향을 미칩니다.

- 명확하고 짧게: "이 도구는 사용자가 ~할 때 ~하기 위해 사용하는 도구입니다." (X) -> "Fetch policy details by policy_id." (O)
- Enum 활용: 파라미터가 정해져 있다면 자유 입력(String) 대신 `enum`으로 제한하여 환각(Hallucination)을 방지하세요.

```python
# Tool Description 최적화 예시 (Python)
tools = [{
    "name": "check_eligibility",
    "description": "Evaluate user eligibility for a specific youth policy.", # 짧은 영어 사용
    "parameters": {
        "type": "object",
        "properties": {
            "policy_id": {"type": "string"},
            "user_age": {"type": "integer"}
        },
        "required": ["policy_id", "user_age"]
    }
}]
