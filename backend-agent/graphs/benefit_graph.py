# graphs/benefit_graph.py

from langgraph.graph import StateGraph

from graphs.states.benefit_state import (
    BenefitState
)

from graphs.nodes.benefit_nodes import (

    load_benefit_context_node,

    effect_worker_node,

    persist_benefit_node
)

from graphs.edges.benefit_edges import (
    register_edges
)


workflow = StateGraph(
    BenefitState
)


# -----------------------------------
# Node 등록
# -----------------------------------

workflow.add_node(
    "load_benefit_context",
    load_benefit_context_node
)

workflow.add_node(
    "effect_worker",
    effect_worker_node
)

workflow.add_node(
    "persist_benefit",
    persist_benefit_node
)


# -----------------------------------
# Edge 등록
# -----------------------------------

workflow = register_edges(
    workflow
)


# -----------------------------------
# Compile
# -----------------------------------

benefit_graph = workflow.compile()