from langgraph.graph.state import (
    START,
    END
)


def register_edges(workflow):

    workflow.add_edge(
        START,
        "load_apply_context"
    )

    workflow.add_edge(
        "load_apply_context",
        "filelist_worker"
    )

    workflow.add_edge(
        "filelist_worker",
        "persist_document"
    )

    workflow.add_edge(
        "persist_document",
        END
    )

    return workflow