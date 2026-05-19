# api/orchestrator.py

from fastapi import FastAPI
from pydantic import BaseModel


# -----------------------------------
# Graph Imports
# -----------------------------------

from graphs.eligibility_graph import (
    eligibility_graph
)

from graphs.document_graph import (
    document_graph
)

from graphs.benefit_graph import (
    benefit_graph
)

from graphs.sync_graph import (
    sync_graph
)


# -----------------------------------
# FastAPI App
# -----------------------------------

app = FastAPI()


# =========================================================
# 1. PRECOMPUTE ELIGIBILITY
# =========================================================

class PrecomputeEligibilityRequest(
    BaseModel
):
    uid: str


@app.post(
    "/api/orchestrator/precompute-eligibility"
)
def precompute_eligibility(
    req: PrecomputeEligibilityRequest
):

    result = eligibility_graph.invoke({

        "uid": req.uid,

        "user_profile": None,

        "policies": [],

        "eligible_records": [],

        "error": None
    })

    # -------------------------
    # 에러 처리
    # -------------------------

    if result.get("error"):

        return {

            "status": "error",

            "workflow":
                "eligibility_graph",

            "message":
                result["error"]
        }

    # -------------------------
    # 성공 응답
    # -------------------------

    return {

        "status": "success",

        "workflow":
            "eligibility_graph",

        "uid":
            req.uid,

        "eligible_count":
            len(
                result[
                    "eligible_records"
                ]
            ),

        "result":
            result[
                "eligible_records"
            ]
    }


# =========================================================
# 2. APPLY GRAPH
# =========================================================

class DocumentRequest(
    BaseModel
):

    policy_id: str


@app.post(
    "/api/orchestrator/extract-policy-documents"
)
def extract_policy_documents(
    req: DocumentRequest
):

    result = document_graph.invoke({

        "policy_id":
            req.policy_id,

        "policy_data":
            None,

        "extracted_documents": [],

        "error": None
    })

    if result.get("error"):

        return {

            "status": "error",

            "workflow":
                "document_graph",

            "message":
                result["error"]
        }

    return {

        "status": "success",

        "workflow":
            "document_graph",

        "policy_id":
            req.policy_id,

        "document_count":
            len(
                result[
                    "extracted_documents"
                ]
            ),

        "documents":
            result[
                "extracted_documents"
            ]
    }


# =========================================================
# 3. BENEFIT GRAPH
# =========================================================

class BenefitRequest(BaseModel):
    uid: str


@app.post(
    "/api/orchestrator/total-benefit"
)
def total_benefit(
    req: BenefitRequest
):

    result = benefit_graph.invoke({

        "uid": req.uid,

        "user_profile": None,

        "calendar_events": [],

        "policies": [],

        "eligibility_results": [],

        "effect_summary": None,

        "db_saved": False,

        "error": None
    })

    # -------------------------
    # 에러 처리
    # -------------------------

    if result.get("error"):

        return {

            "status": "error",

            "workflow":
                "benefit_graph",

            "message":
                result["error"]
        }

    summary = result[
        "effect_summary"
    ]

    # -------------------------
    # 성공 응답
    # -------------------------

    return {

        "status": "success",

        "workflow":
            "benefit_graph",

        "uid":
            req.uid,

        "total_cash_benefit":
            summary.get(
                "total_cash_benefit",
                ""
            ),

        "total_service_benefit":
            summary.get(
                "total_service_benefit",
                ""
            ),

        "final_summary":
            summary.get(
                "final_summary",
                ""
            ),

        "db_saved":
            result[
                "db_saved"
            ]
    }


# =========================================================
# 4. SYNC GRAPH (정책 변경/신규 정책 등록 시)
# =========================================================

class SyncPolicyRequest(BaseModel):
    policy_id: str


@app.post(
    "/api/orchestrator/sync-new-policy"
)
def sync_new_policy(
    req: SyncPolicyRequest
):

    result = sync_graph.invoke({

        "policy_id": req.policy_id,

        "candidate_users": [],

        "matched_users": [],

        "error": None
    })

    if result.get("error"):

        return {

            "status": "error",

            "workflow":
                "sync_graph",

            "message":
                result["error"]
        }

    return {

        "status": "success",

        "workflow":
            "sync_graph",

        "policy_id":
            req.policy_id,

        "matched_count":
            len(
                result[
                    "matched_users"
                ]
            )
    }
