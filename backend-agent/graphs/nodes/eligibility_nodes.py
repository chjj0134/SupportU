import json
import time

from langchain_core.messages import HumanMessage

from db.supabase_client import supabase

from agents.eligibility_agent import (
    app as eligibility_workflow
)


def load_user_node(state):

    uid = state["uid"]

    user_res = supabase.table(
        "user_profiles"
    ).select("*").eq(
        "uid",
        uid
    ).execute()

    return {
        **state,
        "user_profile": user_res.data[0]
    }


def filter_policy_node(state):

    user = state["user_profile"]

    city = user.get("city", "")
    age = user.get("age", 0)

    policies_res = supabase.table(
        "policies"
    ).select(
        "policy_id, title, summary, eligibility, amin, amax, region"
    ).in_(
        "region",
        [city, "전국"]
    ).execute()

    filtered = []

    for policy in policies_res.data:

        amin = int(float(policy.get("amin", 0)))
        amax = int(float(policy.get("amax", 99)))

        if amin <= age <= amax:
            filtered.append(policy)

    return {
        **state,
        "policies": filtered
    }


def eligibility_worker_node(state):

    user = state["user_profile"]

    results = []

    for policy in state["policies"]:

        human_msg = f'''
<user_profile>
{json.dumps(user, ensure_ascii=False)}
</user_profile>

<policy_criteria>
{json.dumps(policy, ensure_ascii=False)}
</policy_criteria>
'''

        result = eligibility_workflow.invoke({

            "messages": [
                HumanMessage(content=human_msg)
            ],

            "user_id": user["uid"],

            "policy_id": policy["policy_id"]
        })

        output = result["messages"][-1].content

        if "true" in output.lower():

            results.append({
                "uid": user["uid"],
                "policy_id": policy["policy_id"],
                "is_eligible": True,
                "unmet_conditions": output
            })

        time.sleep(0.2)

    return {
        **state,
        "eligible_records": results
    }


def persist_eligibility_node(state):

    uid = state["uid"]

    supabase.table(
        "eligibility_results"
    ).delete().eq(
        "uid",
        uid
    ).execute()

    if state["eligible_records"]:

        supabase.table(
            "eligibility_results"
        ).insert(
            state["eligible_records"]
        ).execute()

    return state