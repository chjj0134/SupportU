from typing import TypedDict


class SyncState(TypedDict):

    policy_id: str

    policy: dict

    candidate_users: list

    matched_users: list

    error: str | None