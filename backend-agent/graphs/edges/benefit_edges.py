# graphs/edges/benefit_edges.py

from langgraph.graph.state import (
    START,
    END
)


def register_edges(workflow):

    workflow.add_edge(
        START,
        "load_benefit_context"
    )

    workflow.add_edge(
        "load_benefit_context",
        "effect_worker"
    )

    workflow.add_edge(
        "effect_worker",
        "persist_benefit"
    )

    workflow.add_edge(
        "persist_benefit",
        END
    )

    return workflow