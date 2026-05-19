from typing import TypedDict
from typing import List
from typing import Optional


class EligibilityState(TypedDict):

    uid: str

    user_profile: Optional[dict]

    policies: List[dict]

    eligible_records: List[dict]

    error: Optional[str]