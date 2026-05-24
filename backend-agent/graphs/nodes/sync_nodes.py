import json
import time

from langchain_core.messages import (
    HumanMessage
)

from db.supabase_client import (
    supabase
)

from agents.eligibility_agent import (
    eligibility_workflow
)


# =========================================================
# 정책 로드
# =========================================================

def load_policy_node(state):

    print(
        "[NODE] load_policy_node"
    )

    policy_id = state[
        "policy_id"
    ]

    res = supabase.table(
        "policies"
    ).select(
        "*"
    ).eq(
        "policy_id",
        policy_id
    ).execute()

    if not res.data:

        return {

            **state,

            "error":
                "Policy not found"
        }

    return {

        **state,

        "policy":
            res.data[0]
    }


# =========================================================
# 후보 유저 탐색
# =========================================================

def find_candidate_users_node(state):

    print(
        "[NODE] find_candidate_users_node"
    )

    policy = state["policy"]

    amin = int(
        float(
            policy.get("amin") or 0
        )
    )

    amax = int(
        float(
            policy.get("amax") or 99
        )
    )

    region = policy.get(
        "region",
        "전국"
    )

    query = supabase.table(
        "user_profiles"
    ).select("*")

    query = query.gte(
        "age",
        amin
    ).lte(
        "age",
        amax
    )

    users_res = query.execute()

    users = users_res.data

    # 지역 필터
    if region != "전국":

        users = [

            u for u in users

            if u.get("city") == region
        ]

    return {

        **state,

        "candidate_users":
            users
    }


# =========================================================
# eligibility 판단
# =========================================================

def sync_eligibility_worker_node(state):

    print(
        "[NODE] sync_eligibility_worker_node"
    )

    policy = state["policy"]

    matched = []

    for user in state[
        "candidate_users"
    ]:

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

                HumanMessage(
                    content=human_msg
                )
            ],

            "user_id":
                user["uid"],

            "policy_id":
                policy["policy_id"]
        })

        output = result[
            "messages"
        ][-1].content

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

        try:

            parsed = json.loads(
                clean_output
            )

        except Exception as e:

            print(
                "[ERROR]",
                e
            )

            continue

        is_eligible = parsed.get(
            "is_eligible",
            False
        )

        reason = parsed.get(
            "reason",
            ""
        )

        if is_eligible:

            matched.append({

                "uid":
                    user["uid"],

                "policy_id":
                    policy[
                        "policy_id"
                    ],

                "is_eligible":
                    True,

                "unmet_conditions":
                    None
            })

        time.sleep(0.2)

    return {

        **state,

        "matched_users":
            matched
    }


# =========================================================
# 저장
# =========================================================

def persist_sync_results_node(state):

    print(
        "[NODE] persist_sync_results_node"
    )

    policy_id = state[
        "policy_id"
    ]

    # 기존 결과 삭제
    supabase.table(
        "eligibility_results"
    ).delete().eq(
        "policy_id",
        policy_id
    ).execute()

    # 신규 저장
    if state[
        "matched_users"
    ]:

        supabase.table(
            "eligibility_results"
        ).insert(
            state[
                "matched_users"
            ]
        ).execute()

    return state