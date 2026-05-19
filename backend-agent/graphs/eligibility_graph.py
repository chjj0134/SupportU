from langgraph.graph import StateGraph

from graphs.states.eligibility_state import (
    EligibilityState
)

from graphs.nodes.eligibility_nodes import (
    load_user_node,
    filter_policy_node,
    eligibility_worker_node,
    persist_eligibility_node
)

from graphs.edges.eligibility_edges import (
    register_edges
)


workflow = StateGraph(
    EligibilityState
)


workflow.add_node(
    "load_user",
    load_user_node
)

workflow.add_node(
    "filter_policy",
    filter_policy_node
)

workflow.add_node(
    "eligibility_worker",
    eligibility_worker_node
)

workflow.add_node(
    "persist_eligibility",
    persist_eligibility_node
)


workflow = register_edges(
    workflow
)


eligibility_graph = workflow.compile()