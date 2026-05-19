from langgraph.graph import (
    START,
    END
)


def register_edges(
    workflow
):

    # =====================================================
    # START
    # =====================================================

    workflow.add_edge(
        START,
        "load_policy"
    )

    # =====================================================
    # load_policy
    # =====================================================

    workflow.add_conditional_edges(

        "load_policy",

        route_after_load_policy
    )

    # =====================================================
    # candidate search
    # =====================================================

    workflow.add_conditional_edges(

        "find_candidate_users",

        route_after_candidate_search
    )

    # =====================================================
    # sync worker
    # =====================================================

    workflow.add_conditional_edges(

        "sync_worker",

        route_after_sync_worker
    )

    # =====================================================
    # persist
    # =====================================================

    workflow.add_edge(
        "persist_sync",
        END
    )

    return workflow


# =========================================================
# routing functions
# =========================================================

def route_after_load_policy(
    state
):

    if state.get(
        "error"
    ):

        return END

    return "find_candidate_users"


def route_after_candidate_search(
    state
):

    users = state.get(
        "candidate_users",
        []
    )

    if not users:

        return END

    return "sync_worker"


def route_after_sync_worker(
    state
):

    return "persist_sync"