"""
A2S – AI Interior Design Product Recommendation Agent.
Premium UI with glowing accents, glassmorphism, tabs for Chat + Browse.
Usage: streamlit run app.py
"""

import streamlit as st

from config import APP_TITLE, APP_ICON, APP_DESCRIPTION
from agent.context import (
    init_context,
    add_message,
    get_messages,
    get_active_filters,
    get_context_summary,
    reset_filters,
)
from agent.core import process_message
from data.loader import load_product_catalog, get_catalog_summary
from data.filter_engine import filter_products
from data.ranker import rank_products
from utils.formatters import display_product_cards, format_product_summary
from utils.validators import sanitize_message


# ── Page Config ──
st.set_page_config(
    page_title=APP_TITLE,
    page_icon=APP_ICON,
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Premium CSS ──
st.markdown("""
<style>
[data-testid="stSidebar"]        { display: none; }
[data-testid="collapsedControl"] { display: none; }

.stApp { background: #0a0a1a; }

@keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
.hero {
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7, #6366f1);
    background-size: 300% 300%;
    animation: gradientShift 8s ease infinite;
    padding: 1.8rem 2.4rem;
    border-radius: 18px;
    overflow: hidden;
    margin-bottom: 1rem;
    box-shadow: 0 0 40px rgba(139,92,246,0.35);
    position: relative;
}
.hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%);
    pointer-events: none;
}
.hero h1 { margin:0; font-size:2rem; font-weight:800; color:#fff; text-shadow:0 0 30px rgba(255,255,255,0.3); }
.hero p  { margin:0.3rem 0 0 0; font-size:0.95rem; color:rgba(255,255,255,0.85); }

.glow-card {
    background: rgba(30,30,60,0.7);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(139,92,246,0.25);
    border-radius: 14px;
    padding: 1rem 0.8rem;
    text-align: center;
    transition: transform 0.25s, box-shadow 0.25s;
}
.glow-card:hover { transform: translateY(-4px); box-shadow: 0 0 25px rgba(139,92,246,0.4); }
.glow-card .icon  { font-size: 1.6rem; margin-bottom: 0.2rem; }
.glow-card .value { font-size: 1.35rem; font-weight: 700; color: #c4b5fd; }
.glow-card .label { font-size: 0.72rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.15rem; }

.filter-section {
    background: rgba(30,30,60,0.5);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(139,92,246,0.15);
    border-radius: 14px;
    padding: 0.8rem 1.2rem;
    margin-bottom: 0.5rem;
}
.fpill {
    display: inline-block;
    background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25));
    border: 1px solid rgba(139,92,246,0.4);
    color: #c4b5fd;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.78rem;
    margin: 0.1rem 0.15rem;
    box-shadow: 0 0 8px rgba(139,92,246,0.2);
}

div[data-testid="stHorizontalBlock"] button {
    background: rgba(30,30,60,0.6) !important;
    border: 1px solid rgba(139,92,246,0.3) !important;
    color: #c4b5fd !important;
    border-radius: 24px !important;
    font-size: 0.8rem !important;
    transition: all 0.25s !important;
}
div[data-testid="stHorizontalBlock"] button:hover {
    background: rgba(99,102,241,0.3) !important;
    border-color: rgba(139,92,246,0.7) !important;
    box-shadow: 0 0 18px rgba(139,92,246,0.35) !important;
    color: #fff !important;
}

[data-testid="stChatMessage"] {
    background: rgba(20,20,45,0.5) !important;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(139,92,246,0.1) !important;
    border-radius: 14px !important;
    margin-bottom: 0.5rem !important;
}

[data-testid="stChatInput"] textarea {
    background: rgba(30,30,60,0.7) !important;
    border: 1px solid rgba(139,92,246,0.3) !important;
    border-radius: 14px !important;
    color: #e2e8f0 !important;
}
[data-testid="stChatInput"] textarea:focus {
    border-color: rgba(139,92,246,0.7) !important;
    box-shadow: 0 0 20px rgba(139,92,246,0.25) !important;
}

div[data-testid="stContainer"] {
    background: rgba(25,25,55,0.6) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(139,92,246,0.15) !important;
    border-radius: 14px !important;
    transition: all 0.3s !important;
}
div[data-testid="stContainer"]:hover {
    border-color: rgba(139,92,246,0.5) !important;
    box-shadow: 0 8px 30px rgba(139,92,246,0.2) !important;
    transform: translateY(-4px);
}

a[data-testid="stBaseLinkButton-secondary"] {
    background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
    color: white !important;
    border: none !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    transition: all 0.25s !important;
}
a[data-testid="stBaseLinkButton-secondary"]:hover {
    box-shadow: 0 0 20px rgba(139,92,246,0.5) !important;
    transform: scale(1.02);
}

hr { border-color: rgba(139,92,246,0.15) !important; }
::-webkit-scrollbar       { width: 6px; }
::-webkit-scrollbar-track  { background: #0a0a1a; }
::-webkit-scrollbar-thumb  { background: #6366f1; border-radius: 3px; }

button[kind="secondary"] {
    border-color: rgba(239,68,68,0.4) !important;
    color: #fca5a5 !important;
}
button[kind="secondary"]:hover {
    background: rgba(239,68,68,0.15) !important;
    box-shadow: 0 0 15px rgba(239,68,68,0.3) !important;
}
</style>
""", unsafe_allow_html=True)


# ── Initialize ──
init_context()
catalog = load_product_catalog()
stats = get_catalog_summary(catalog)


# ── Hero Banner ──
st.markdown("""
<div class="hero">
    <h1>🏠 A2S – AI Interior Design Assistant</h1>
    <p>Discover the perfect furniture, lighting &amp; decor — powered by AI. Just describe your dream room.</p>
</div>
""", unsafe_allow_html=True)


# ── Glowing Stats Row ──
by_source = stats.get("by_source", {})
source_count = len([s for s in by_source if s != "original_data"])
c1, c2, c3, c4, c5 = st.columns(5)
with c1:
    st.markdown(f'<div class="glow-card"><div class="icon">🪑</div><div class="value">{stats["total_products"]:,}</div><div class="label">Products</div></div>', unsafe_allow_html=True)
with c2:
    st.markdown(f'<div class="glow-card"><div class="icon">🏷️</div><div class="value">{len(stats["brands"])}</div><div class="label">Brands</div></div>', unsafe_allow_html=True)
with c3:
    src_parts = []
    for src, cnt in by_source.items():
        name = src.replace(".com","").replace(".in","").replace("_data","").title()
        src_parts.append(f"{name}: {cnt}")
    src_text = " | ".join(src_parts) if src_parts else "1 source"
    st.markdown(f'<div class="glow-card"><div class="icon">🌐</div><div class="value">{len(by_source)}</div><div class="label">Data Sources</div></div>', unsafe_allow_html=True)
with c4:
    ptype_count = len(stats.get("product_types", []))
    st.markdown(f'<div class="glow-card"><div class="icon">📦</div><div class="value">{ptype_count}</div><div class="label">Categories</div></div>', unsafe_allow_html=True)
with c5:
    st.markdown(f'<div class="glow-card"><div class="icon">💰</div><div class="value">₹{stats["price_range"]["min"]:,.0f}–{stats["price_range"]["max"]/1000:.0f}K</div><div class="label">Price Range</div></div>', unsafe_allow_html=True)


# ── Active Filters Bar ──
active_filters = get_active_filters()
fcol, rcol = st.columns([5, 1])
with fcol:
    if active_filters:
        pills = ""
        for k, v in active_filters.items():
            if v is not None:
                lbl = k.replace("_", " ").title()
                val = f"₹{v:,.0f}" if isinstance(v, (int, float)) else str(v).title()
                pills += f'<span class="fpill">{lbl}: {val}</span>'
        st.markdown(f'<div class="filter-section">🎯 <strong style="color:#c4b5fd;">Active Filters</strong>&nbsp;&nbsp;{pills}</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="filter-section" style="color:#6b7280;">🎯 No filters active — describe your dream room or browse products below!</div>', unsafe_allow_html=True)
with rcol:
    if st.button("🔄 Reset", use_container_width=True, type="secondary"):
        st.session_state.messages = []
        st.session_state.active_filters = {}
        st.session_state.last_products = None
        st.rerun()


# ── Quick Suggestion Chips ──
suggestions = [
    ("🛋️", "Sofa for living room under 30000"),
    ("🛏️", "Modern bedroom furniture in warm tones"),
    ("💡", "Study room lighting options"),
    ("🎨", "Ethnic style decor under 5000"),
    ("🪑", "IKEA kids room furniture"),
]
sug_cols = st.columns(len(suggestions))
for i, (icon, text) in enumerate(suggestions):
    with sug_cols[i]:
        if st.button(f"{icon} {text}", key=f"sug_{i}", use_container_width=True):
            st.session_state._pending_suggestion = text
            st.rerun()

st.divider()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Two Tabs: AI Chat + Browse Products
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
tab_chat, tab_browse = st.tabs(["💬 AI Chat", "🛍️ Browse Products"])


# ── TAB 1: AI Chat ──
with tab_chat:
    for msg in get_messages():
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if msg.get("products"):
                display_product_cards(msg["products"])

    if not get_messages():
        source_info = stats.get("by_source", {})
        source_labels = []
        for src, cnt in source_info.items():
            if src == "original_data":
                source_labels.append(f"curated designs ({cnt})")
            else:
                source_labels.append(f"**{src}** ({cnt})")
        sources_str = ", ".join(source_labels) if source_labels else "multiple sources"

        with st.chat_message("assistant"):
            st.markdown(
                f"Hey there! Welcome to **A2S** — your personal AI interior design advisor. ✨\n\n"
                f"I have **{stats['total_products']:,} products** sourced live from {sources_str} — "
                f"from cozy sofas to elegant lighting, across **{len(stats['brands'])} brands**.\n\n"
                f"**Here's how I work:**\n"
                f"- 💬 Just describe what you need — *\"I want a modern sofa for my living room under ₹40K\"*\n"
                f"- 🔄 Refine anytime — *\"make it cheaper\"*, *\"show warm colors\"*, *\"try a different style\"*\n"
                f"- 🧠 I remember everything — your preferences stack up across messages\n"
                f"- 🎯 I show you products with **images, prices, sizes, and buy links**\n\n"
                f"Let's design something beautiful. What room are we starting with?"
            )


# ── TAB 2: Browse Products ──
with tab_browse:
    st.markdown("### 🛍️ Browse the Full Catalog")
    st.caption("Use the filters below to explore products — no AI needed!")

    # Source filter (Amazon, IKEA, Flipkart, Original)
    sources_list = sorted(catalog["source"].dropna().unique().tolist()) if "source" in catalog.columns else []
    product_types_list = sorted(catalog["product_type"].dropna().unique().tolist()) if "product_type" in catalog.columns else []
    styles_list = sorted(stats.get("styles", []))
    colors_list = sorted(stats.get("color_palettes", []))

    bf0, bf1, bf2, bf3, bf4 = st.columns(5)
    with bf0:
        b_source = st.selectbox("🌐 Source", ["All"] + sources_list, key="br_source")
    with bf1:
        b_type = st.selectbox("🪑 Product", ["All"] + product_types_list, key="br_type")
    with bf2:
        b_style = st.selectbox("🎨 Style", ["All"] + styles_list, key="br_style")
    with bf3:
        b_color = st.selectbox("🎯 Color", ["All"] + colors_list, key="br_color")
    with bf4:
        b_budget = st.select_slider(
            "💰 Max Budget (₹)",
            options=[1000, 5000, 10000, 15000, 20000, 30000, 50000, 75000, 100000, 200000, 500000],
            value=500000,
            key="br_budget",
        )

    browse_filters = {}
    if b_type != "All":
        browse_filters["product_type"] = b_type
    if b_style != "All":
        browse_filters["style"] = b_style
    if b_color != "All":
        browse_filters["color_palette"] = b_color
    if b_budget < 500000:
        browse_filters["budget_max"] = b_budget

    # Source filter handled separately (not in filter_engine)
    browse_catalog = catalog
    if b_source != "All" and "source" in catalog.columns:
        browse_catalog = catalog[catalog["source"] == b_source]

    browse_results = filter_products(browse_catalog, browse_filters)
    total_found = len(browse_results)

    st.markdown(f"**✨ Showing {min(total_found, 10)} of {total_found} matching products**")

    if not browse_results.empty:
        top_browse = rank_products(browse_results, browse_filters, top_n=10)
        display_product_cards(top_browse.to_dict("records"))
    else:
        st.warning("No products match these filters. Try broadening your criteria.")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Chat Input (always at bottom)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pending = st.session_state.get("_pending_suggestion")
if pending:
    del st.session_state._pending_suggestion
    user_input = pending
else:
    user_input = None

typed_input = st.chat_input("✨ Describe your dream room, budget, style, or ask anything...")
if typed_input:
    user_input = typed_input

if user_input:
    user_input = sanitize_message(user_input)
    if not user_input:
        st.stop()

    with st.chat_message("user"):
        st.markdown(user_input)

    with st.chat_message("assistant"):
        with st.spinner("✨ Finding the perfect products for you..."):
            response = process_message(user_input, catalog)

        response_text = response["response_text"]
        products = response.get("products")
        stored_text = response_text
        if products:
            stored_text += format_product_summary(products)

        st.markdown(response_text)

        if response.get("error"):
            st.error(response["error"])

        if products:
            st.markdown(f"---\n✨ **Found {len(products)} product(s) matching your style:**")
            display_product_cards(products)

    add_message("user", user_input)
    add_message("assistant", stored_text, products=products)
    st.rerun()
