from typing import TypedDict
from typing import Optional


class ApplyState(TypedDict):

    uid: str

    policy_id: str

    user_profile: Optional[dict]

    policy_data: Optional[dict]

    document_result: Optional[dict]

    error: Optional[str]