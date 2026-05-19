import json

from db.supabase_client import supabase

from agents.filelist_agent import (
    run_filelist_agent
)


def load_apply_context_node(state):

    uid = state["uid"]
    policy_id = state["policy_id"]

    user_res = supabase.table(
        "user_profiles"
    ).select("*").eq(
        "uid",
        uid
    ).execute()

    policy_res = supabase.table(
        "policies"
    ).select("*").eq(
        "policy_id",
        policy_id
    ).execute()

    return {
        **state,

        "user_profile":
            user_res.data[0],

        "policy_data":
            policy_res.data[0]
    }


def filelist_worker_node(state):

    user = state["user_profile"]

    policy = state["policy_data"]

    result = run_filelist_agent(
        policy["detail_url"],
        json.dumps(user)
    )

    return {
        **state,
        "document_result": result
    }


def persist_document_node(state):

    uid = state["uid"]

    policy_id = state["policy_id"]

    policy = state["policy_data"]

    supabase.table(
        "document_drafts"
    ).insert({

        "uid": uid,

        "policy_id": policy_id,

        "doc_url":
            policy["detail_url"],

        "dcontent":
            json.dumps(
                state["document_result"],
                ensure_ascii=False
            ),

        "draft_status":
            "generated"

    }).execute()

    return state