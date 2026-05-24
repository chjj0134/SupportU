from typing import TypedDict


class DocumentState(TypedDict):

    policy_id: str

    policy_data: dict

    extracted_documents: list

    error: str | None