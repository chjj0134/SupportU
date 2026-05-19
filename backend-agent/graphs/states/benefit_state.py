# graphs/states/benefit_state.py

from typing import TypedDict
from typing import Optional
from typing import List


class BenefitState(TypedDict):

    # 사용자 ID
    uid: str

    # 사용자 정보
    user_profile: Optional[dict]

    # 캘린더 이벤트
    calendar_events: List[dict]

    # 정책 데이터
    policies: List[dict]

    # eligibility 결과
    eligibility_results: List[dict]

    # 최종 effect 결과
    effect_summary: Optional[dict]

    # DB 저장 여부
    db_saved: bool

    # 에러 상태
    error: Optional[str]