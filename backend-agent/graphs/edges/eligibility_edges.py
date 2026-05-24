from langgraph.graph.state import (
    START,
    END
)


def register_edges(workflow):

    workflow.add_edge(
        START,
        "load_user"
    )

    workflow.add_edge(
        "load_user",
        "filter_policy"
    )

    workflow.add_edge(
        "filter_policy",
        "eligibility_worker"
    )

    workflow.add_edge(
        "eligibility_worker",
        "persist_eligibility"
    )

    workflow.add_edge(
        "persist_eligibility",
        END
    )

    return workflow