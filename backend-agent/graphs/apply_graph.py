from langgraph.graph import StateGraph

from graphs.states.apply_state import (
    ApplyState
)

from graphs.nodes.apply_nodes import (
    load_apply_context_node,
    filelist_worker_node,
    persist_document_node
)

from graphs.edges.apply_edges import (
    register_edges
)


workflow = StateGraph(
    ApplyState
)


workflow.add_node(
    "load_apply_context",
    load_apply_context_node
)

workflow.add_node(
    "filelist_worker",
    filelist_worker_node
)

workflow.add_node(
    "persist_document",
    persist_document_node
)


workflow = register_edges(
    workflow
)


apply_graph = workflow.compile()