from langgraph.graph import (
    StateGraph
)

from graphs.states.document_state import (
    DocumentState
)

from graphs.nodes.document_nodes import (

    load_policy_context_node,

    document_extraction_worker_node,

    persist_policy_documents_node
)

from graphs.edges.document_edges import (
    register_edges
)


workflow = StateGraph(
    DocumentState
)


# =========================================================
# nodes
# =========================================================

workflow.add_node(
    "load_policy_context",
    load_policy_context_node
)

workflow.add_node(
    "document_extraction_worker",
    document_extraction_worker_node
)

workflow.add_node(
    "persist_policy_documents",
    persist_policy_documents_node
)


# =========================================================
# edges
# =========================================================

workflow = register_edges(
    workflow
)


document_graph = workflow.compile()