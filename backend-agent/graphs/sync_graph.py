from langgraph.graph import (
    StateGraph
)

from graphs.states.sync_state import (
    SyncState
)

from graphs.nodes.sync_nodes import (

    load_policy_node,

    find_candidate_users_node,

    sync_eligibility_worker_node,

    persist_sync_results_node
)

from graphs.edges.sync_edges import (
    register_edges
)


workflow = StateGraph(
    SyncState
)


# =========================================================
# nodes
# =========================================================

workflow.add_node(
    "load_policy",
    load_policy_node
)

workflow.add_node(
    "find_candidate_users",
    find_candidate_users_node
)

workflow.add_node(
    "sync_worker",
    sync_eligibility_worker_node
)

workflow.add_node(
    "persist_sync",
    persist_sync_results_node
)


# =========================================================
# edges
# =========================================================

workflow = register_edges(
    workflow
)


sync_graph = workflow.compile()