import json

from db.supabase_client import (
    supabase
)

from agents.filelist_agent import (
    run_document_extraction_agent
)


# =========================================================
# load policy
# =========================================================

def load_policy_context_node(state):

    policy_id = state[
        "policy_id"
    ]

    policy_res = supabase.table(
        "policies"
    ).select("*").eq(
        "policy_id",
        policy_id
    ).execute()

    if not policy_res.data:

        return {

            **state,

            "error":
                f"Policy not found: {policy_id}"
        }

    return {

        **state,

        "policy_data":
            policy_res.data[0]
    }


# =========================================================
# extraction worker
# =========================================================

def document_extraction_worker_node(state):

    policy = state[
        "policy_data"
    ]

    detail_url = policy.get(
        "detail_url"
    )

    if not detail_url:

        return {

            **state,

            "error":
                "Policy detail_url missing"
        }

    # =====================================================
    # agent 실행
    # =====================================================

    output = run_document_extraction_agent(
        detail_url
    )

    # =====================================================
    # JSON cleaning
    # =====================================================

    clean_output = (
        output
        .replace(
            "```json",
            ""
        )
        .replace(
            "```",
            ""
        )
        .strip()
    )

    # =====================================================
    # parsing
    # =====================================================

    try:

        parsed = json.loads(
            clean_output
        )

    except Exception as e:

        print(
            "[JSON PARSE ERROR]",
            clean_output
        )

        return {

            **state,

            "error":
                f"JSON parsing failed: {e}"
        }

    return {

        **state,

        "extracted_documents":
            parsed.get(
                "documents",
                []
            )
    }


# =========================================================
# persist
# =========================================================

def persist_policy_documents_node(state):

    policy_id = state[
        "policy_id"
    ]

    documents = state[
        "extracted_documents"
    ]

    # =====================================================
    # 기존 데이터 삭제
    # =====================================================

    supabase.table(
        "policy_documents"
    ).delete().eq(
        "policy_id",
        policy_id
    ).execute()

    rows = []

    for doc in documents:

        rows.append({

            "policy_id":
                policy_id,

            "doc_name":
                doc.get(
                    "doc_name",
                    ""
                ),

            "is_required":
                doc.get(
                    "is_required",
                    True
                ),

            "doc_guide":
                doc.get(
                    "doc_guide",
                    ""
                ),

            "doc_url":
                doc.get(
                    "doc_url",
                    None
                )
        })

    # =====================================================
    # insert
    # =====================================================

    if rows:

        supabase.table(
            "policy_documents"
        ).insert(
            rows
        ).execute()

    return state