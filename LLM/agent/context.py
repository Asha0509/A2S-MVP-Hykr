"""
Context Manager for the AI Agent.

Manages the full conversation history and accumulated search filters
in Streamlit session state so that context is NEVER lost across
chat turns.

Architecture:
    - messages[]       : Full chat history (role + content)
    - active_filters{} : Currently accumulated search filters
    - search_history[] : Past search filter snapshots
"""

from __future__ import annotations
from typing import Any

try:
    import streamlit as st
    from streamlit.runtime.scriptrunner import get_script_run_context
except ImportError:
    st = None
    get_script_run_context = lambda: None

# Global fallback state for non-Streamlit environments (Flask API, CLI)
_FALLBACK_STATE = {
    "messages": [],
    "active_filters": {},
    "search_history": [],
    "last_products": None
}

def _get_state():
    """Access the appropriate session state based on execution environment."""
    if st and get_script_run_context():
        return st.session_state
    return _FALLBACK_STATE

def init_context() -> None:
    """Initialize all session-state keys if they don't exist."""
    state = _get_state()
    if "messages" not in state:
        state["messages"] = []

    if "active_filters" not in state:
        state["active_filters"] = {}

    if "search_history" not in state:
        state["search_history"] = []

    if "last_products" not in state:
        state["last_products"] = None


def add_message(role: str, content: str, products: Any = None) -> None:
    """Append a message to the conversation history."""
    init_context()
    state = _get_state()
    msg = {"role": role, "content": content}
    if products is not None:
        msg["products"] = products
    state["messages"].append(msg)


def get_messages() -> list[dict]:
    """Return the full conversation history."""
    init_context()
    return _get_state()["messages"]


def get_messages_for_llm() -> list[dict]:
    """Return messages formatted for the Gemini API."""
    init_context()
    state = _get_state()
    formatted = []
    for msg in state["messages"]:
        role = "model" if msg["role"] == "assistant" else "user"
        formatted.append({
            "role": role,
            "parts": [{"text": msg["content"]}],
        })
    return formatted


def update_filters(new_filters: dict) -> None:
    """Merge new filters into the active filter set."""
    init_context()
    state = _get_state()
    current = state["active_filters"]

    for key, value in new_filters.items():
        if value is not None:
            current[key] = value

    # ── Fix contradictory budget ──
    bmin = current.get("budget_min")
    bmax = current.get("budget_max")
    if bmin is not None and bmax is not None:
        if float(bmin) > float(bmax):
            if "budget_max" in new_filters and new_filters["budget_max"] is not None:
                current.pop("budget_min", None)
            elif "budget_min" in new_filters and new_filters["budget_min"] is not None:
                current.pop("budget_max", None)
            else:
                current.pop("budget_min", None)

    # ── Fix contradictory dimensions ──
    dim_pairs = [("min_width", "max_width"), ("min_depth", "max_depth"), ("min_height", "max_height")]
    for dmin, dmax in dim_pairs:
        vmin = current.get(dmin)
        vmax = current.get(dmax)
        if vmin is not None and vmax is not None and float(vmin) > float(vmax):
            if dmax in new_filters and new_filters[dmax] is not None:
                current.pop(dmin, None)
            else:
                current.pop(dmax, None)

    state["active_filters"] = current


def get_active_filters() -> dict:
    """Return the current accumulated filters."""
    init_context()
    return _get_state()["active_filters"].copy()


def reset_filters() -> None:
    """Clear all active filters."""
    init_context()
    state = _get_state()
    if state["active_filters"]:
        state["search_history"].append(
            state["active_filters"].copy()
        )
    state["active_filters"] = {}
    state["last_products"] = None


def set_last_products(products: list[dict] | None) -> None:
    """Store the last set of products shown."""
    init_context()
    _get_state()["last_products"] = products


def get_last_products() -> list[dict] | None:
    """Return the last set of products shown."""
    init_context()
    return _get_state()["last_products"]


def get_context_summary() -> str:
    """Build a short text summary of current context."""
    init_context()
    state = _get_state()
    filters = state["active_filters"]
    if not filters:
        return "No active filters"

    parts = []
    if filters.get("room_type"):
        parts.append(f"Room: {filters['room_type']}")
    if filters.get("style"):
        parts.append(f"Style: {filters['style']}")
    if filters.get("product_type"):
        parts.append(f"Product: {filters['product_type']}")
    if filters.get("budget_max"):
        parts.append(f"Budget: up to ₹{filters['budget_max']}")
    
    return " · ".join(parts) if parts else "Filters active"
