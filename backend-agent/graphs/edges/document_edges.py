from langgraph.graph.state import (

    START,

    END
)


def register_edges(workflow):

    # =====================================================
    # START
    # =====================================================

    workflow.add_edge(
        START,
        "load_policy_context"
    )

    # =====================================================
    # context routing
    # =====================================================

    workflow.add_conditional_edges(

        "load_policy_context",

        route_after_context_load
    )

    # =====================================================
    # extraction routing
    # =====================================================

    workflow.add_conditional_edges(

        "document_extraction_worker",

        route_after_extraction
    )

    # =====================================================
    # persist
    # =====================================================

    workflow.add_edge(
        "persist_policy_documents",
        END
    )

    return workflow


# =========================================================
# routing functions
# =========================================================

def route_after_context_load(
    state
):

    if state.get(
        "error"
    ):

        return END

    return "document_extraction_worker"


def route_after_extraction(
    state
):

    if state.get(
        "error"
    ):

        return END

    return "persist_policy_documents"